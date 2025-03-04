// Copyright 2022 The LUCI Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package model

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"regexp"
	"sort"
	"strings"
	"time"

	"go.chromium.org/luci/auth/identity"
	"go.chromium.org/luci/auth_service/api/configspb"
	"go.chromium.org/luci/common/clock"
	"go.chromium.org/luci/common/data/stringset"
	"go.chromium.org/luci/common/errors"
	"go.chromium.org/luci/common/logging"
	"go.chromium.org/luci/gae/service/datastore"
	"go.chromium.org/luci/server/auth"

	"google.golang.org/protobuf/encoding/prototext"
)

// Imports groups from some external tar.gz bundle or plain text list.
// External URL should serve *.tar.gz file with the following file structure:
//   <external group system name>/<group name>:
//     userid
//     userid
//     ...

// For example ldap.tar.gz may look like:
//   ldap/trusted-users:
//     jane
//     joe
//     ...
//   ldap/all:
//     jane
//     joe
//     ...

// Each tarball may have groups from multiple external systems, but groups from
// some external system must not be split between multiple tarballs. When importer
// sees <external group system name>/* in a tarball, it modifies group list from
// that system on the server to match group list in the tarball _exactly_,
// including removal of groups that are on the server, but no longer present in
// the tarball.

// Plain list format should have one userid per line and can only describe a single
// group in a single system. Such groups will be added to 'external/*' groups
// namespace. Removing such group from importer config will remove it from
// service too.

// The service can also be configured to accept tarball uploads (instead of
// fetching them). Fetched and uploaded tarballs are handled in the exact same way,
// in particular all caveats related to external group system names apply.

// GroupImporterConfig is a singleton entity that contains the contents of the imports.cfg file.
type GroupImporterConfig struct {
	Kind string `gae:"$kind,GroupImporterConfig"`
	ID   string `gae:"$id,config"`

	// ConfigProto is the plaintext copy of the config found at imports.cfg.
	ConfigProto string `gae:"config_proto"`

	// ConfigRevision is revision version of the config found at imports.cfg.
	ConfigRevision []byte `gae:"config_revision"`

	// ModifiedBy is the email of the user who modified the cfg.
	ModifiedBy string `gae:"modified_by"`

	// ModifiedTS is the time when this entity was last modified.
	ModifiedTS time.Time `gae:"modified_ts"`
}

var GroupNameRe = regexp.MustCompile(`^([a-z\-]+/)?[0-9a-z_\-\.@]{1,100}$`)

// GroupBundle is a map where k: groupName, v: list of identities belonging to group k.
type GroupBundle = map[string][]identity.Identity

// GetGroupImporterConfig fetches the GroupImporterConfig entity from the datastore.
//
//	Returns GroupImporterConfig entity if present.
//	Returns datastore.ErrNoSuchEntity if the entity is not present.
//	Returns annotated error for all other errors.
func GetGroupImporterConfig(ctx context.Context) (*GroupImporterConfig, error) {
	groupsCfg := &GroupImporterConfig{
		Kind: "GroupImporterConfig",
		ID:   "config",
	}

	switch err := datastore.Get(ctx, groupsCfg); {
	case err == nil:
		return groupsCfg, nil
	case err == datastore.ErrNoSuchEntity:
		return nil, err
	default:
		return nil, errors.Annotate(err, "error getting GroupImporterConfig").Err()
	}
}

// IngestTarball handles upload of tarball's specified in 'tarball_upload' config entries.
// expected to be called in an auth context of the upload PUT request.
//
// returns
//
//	[]string - list of modified groups
//	int64 - authDBRevision
//	error
//		proto translation error
//		entry is nil
//		entry not found in tarball upload config
//		unauthorized uploader
//		bad tarball structure
func IngestTarball(ctx context.Context, name string, content io.Reader) ([]string, int64, error) {
	g, err := GetGroupImporterConfig(ctx)
	if err != nil {
		return nil, 0, err
	}
	gConfigProto, err := g.ToProto()
	if err != nil {
		return nil, 0, errors.Annotate(err, "issue getting proto from config entity").Err()
	}
	caller := auth.CurrentIdentity(ctx)
	var entry *configspb.GroupImporterConfig_TarballUploadEntry

	// make sure that tarball_upload entry we're looking for is specified in config
	for _, tbu := range gConfigProto.GetTarballUpload() {
		if tbu.Name == name {
			entry = tbu
			break
		}
	}

	if entry == nil {
		return nil, 0, errors.New("entry is nil")
	}

	if entry.Name == "" {
		return nil, 0, errors.New("entry not found in tarball upload names")
	}
	if !contains(caller.Email(), entry.AuthorizedUploader) {
		return nil, 0, errors.New(fmt.Sprintf("%q is not an authorized uploader", caller.Email()))
	}

	bundles, err := loadTarball(ctx, content, entry.GetDomain(), entry.GetSystems(), entry.GetGroups())
	if err != nil {
		return nil, 0, errors.Annotate(err, "bad tarball").Err()
	}

	return importBundles(ctx, bundles, caller, nil)
}

// loadTarball unzips tarball with groups and deserializes them.
func loadTarball(ctx context.Context, content io.Reader, domain string, systems, groups []string) (map[string]GroupBundle, error) {
	// map looks like: K: system, V: { K: groupName, V: []identities }
	bundles := make(map[string]GroupBundle)
	entries, err := extractTarArchive(content)
	if err != nil {
		return nil, err
	}

	// verify system/groupname and then parse blob if valid
	for filename, fileobj := range entries {
		chunks := strings.Split(filename, "/")
		if len(chunks) != 2 || !GroupNameRe.MatchString(chunks[1]) {
			logging.Warningf(ctx, "Skipping file %s, not a valid name", filename)
			continue
		}
		if groups != nil && !contains(filename, groups) {
			continue
		}
		system := chunks[0]
		if !contains(system, systems) {
			logging.Warningf(ctx, "Skipping file %s, not allowed", filename)
			continue
		}
		identities, err := loadGroupFile(string(fileobj), domain)
		if err != nil {
			return nil, err
		}
		if _, ok := bundles[system]; !ok {
			bundles[system] = make(GroupBundle)
		}
		bundles[system][filename] = identities
	}
	return bundles, nil
}

func loadGroupFile(identities string, domain string) ([]identity.Identity, error) {
	members := make(map[identity.Identity]bool)
	memsSplit := strings.Split(identities, "\n")
	for _, uid := range memsSplit {
		uid = strings.TrimSpace(uid)
		if uid == "" {
			continue
		}
		var ident string
		if domain == "" {
			ident = fmt.Sprintf("user:%s", uid)
		} else {
			ident = fmt.Sprintf("user:%s@%s", uid, domain)
		}
		emailIdent, err := identity.MakeIdentity(ident)
		if err != nil {
			return nil, err
		}
		members[emailIdent] = true
	}

	membersSorted := make([]identity.Identity, 0, len(members))
	for mem := range members {
		membersSorted = append(membersSorted, mem)
	}
	sort.Slice(membersSorted, func(i, j int) bool {
		return membersSorted[i].Value() < membersSorted[j].Value()
	})

	return membersSorted, nil
}

// importBundles imports given set of bundles all at once.
// A bundle is a map with groups that is the result of a processing of some tarball.
// A bundle specifies the desired state of all groups under some system, e.g.
// importBundles({'ldap': {}}, ...) will REMOVE all existing 'ldap/*' groups.
//
// Group names in the bundle are specified in their full prefixed form (with
// system name prefix). An example of expected 'bundles':
//
//	{
//	  'ldap': {
//			'ldap/group': [Identity(...), Identity(...)],
//	  },
//	}
//
// Args:
//
//	bundles: map system name -> GroupBundle
//	providedBy: auth.Identity to put in modifiedBy or createdBy fields.
//
// Returns:
//
//	(list of modified groups,
//	new AuthDB revision number or 0 if no changes,
//	error if issue with writing entities).
func importBundles(ctx context.Context, bundles map[string]GroupBundle, providedBy identity.Identity, testHook func()) ([]string, int64, error) {
	// Nothing to process.
	if len(bundles) == 0 {
		return []string{}, 0, nil
	}

	getAuthDBRevision := func(ctx context.Context) (int64, error) {
		state, err := GetReplicationState(ctx)
		switch {
		case err == datastore.ErrNoSuchEntity:
			return 0, nil
		case err != nil:
			return -1, err
		default:
			return state.AuthDBRev, nil
		}
	}

	// Fetches all existing groups and AuthDB revision number.
	groupsSnapshot := func(ctx context.Context) (gMap map[string]*AuthGroup, rev int64, err error) {
		err = datastore.RunInTransaction(ctx, func(ctx context.Context) error {
			groups, err := GetAllAuthGroups(ctx)
			if err != nil {
				return err
			}
			gMap = make(map[string]*AuthGroup, len(groups))
			for _, g := range groups {
				gMap[g.ID] = g
			}
			rev, err = getAuthDBRevision(ctx)
			if err != nil {
				return errors.Annotate(err, "couldn't get AuthDBRev").Err()
			}
			return nil
		}, nil)
		return gMap, rev, err
	}

	// Transactionally puts and deletes a bunch of entities.
	applyImport := func(expectedRevision int64, entitiesToPut, entitiesToDelete []*AuthGroup, ts time.Time) error {
		// Runs in transaction.
		return runAuthDBChange(ctx, "Imported from group bundles", func(ctx context.Context, cae commitAuthEntity) error {
			rev, err := getAuthDBRevision(ctx)
			if err != nil {
				return err
			}

			// DB changed between transactions try again.
			if rev != expectedRevision {
				return errors.New("revision numbers don't match")
			}
			for _, e := range entitiesToPut {
				if err := cae(e, ts, providedBy, false); err != nil {
					return err
				}
			}

			for _, e := range entitiesToDelete {
				if err := cae(e, ts, providedBy, true); err != nil {
					return err
				}
			}
			return nil
		})
	}

	updatedGroups := stringset.New(0)
	revision := int64(0)
	loopCount := 0
	var groups map[string]*AuthGroup
	var err error

	// Try to apply the change in batches until it lands completely or deadline
	// happens. Split each batch update into two transactions (assuming AuthDB
	// changes infrequently) to avoid reading and writing too much stuff from
	// within a single transaction (and to avoid keeping the transaction open while
	// calculating the diff).
	for {
		// Use same timestamp everywhere to reflect that groups were imported
		// atomically within a single transaction.
		ts := clock.Now(ctx).UTC()
		loopCount += 1
		groups, revision, err = groupsSnapshot(ctx)
		if err != nil {
			return nil, revision, err
		}
		// For testing purposes only.
		if testHook != nil && loopCount == 2 {
			testHook()
		}
		entitiesToPut := []*AuthGroup{}
		entitiesToDel := []*AuthGroup{}
		for sys := range bundles {
			iGroups := bundles[sys]
			toPut, toDel := prepareImport(ctx, sys, groups, iGroups)
			entitiesToPut = append(entitiesToPut, toPut...)
			entitiesToDel = append(entitiesToDel, toDel...)
		}

		if len(entitiesToPut) == 0 && len(entitiesToDel) == 0 {
			logging.Infof(ctx, "nothing to do")
			break
		}

		// An `applyImport` transaction can touch at most 500 entities. Cap the
		// number of entities we create/delete by 200 each since we attach a historical
		// entity to each entity. The rest will be updated on the next cycle of the loop.
		// This is safe to do since:
		//  * Imported groups are "leaf" groups (have no subgroups) and can be added
		//    in arbitrary order without worrying about referential integrity.
		//  * Deleted groups are guaranteed to be unreferenced by `prepareImport`
		//    and can be deleted in arbitrary order as well.
		truncated := false

		// Both these operations happen in the same transaction so we have
		// to trim it to make sure the total is <= 200.
		if len(entitiesToPut) > 200 {
			entitiesToPut = entitiesToPut[:200]
			entitiesToDel = nil
			truncated = true
		} else if len(entitiesToPut)+len(entitiesToDel) > 200 {
			entitiesToDel = entitiesToDel[:200-len(entitiesToPut)]
			truncated = true
		}

		// Log what we are about to do to help debugging transaction errors.
		logging.Infof(ctx, "Preparing AuthDB rev %d with %d puts and %d deletes:", revision+1, len(entitiesToPut), len(entitiesToDel))
		for _, e := range entitiesToPut {
			logging.Infof(ctx, "U %s", e.ID)
			updatedGroups.Add(e.ID)
		}
		for _, e := range entitiesToDel {
			logging.Infof(ctx, "D %s", e.ID)
			updatedGroups.Add(e.ID)
		}

		// Land the change iff the current AuthDB revision is still == `revision`.
		err := applyImport(revision, entitiesToPut, entitiesToDel, ts)
		if err != nil && strings.Contains(err.Error(), "revision numbers don't match") {
			logging.Warningf(ctx, "authdb changed between transactions, retrying...")
			continue
		} else if err != nil {
			logging.Errorf(ctx, "couldn't apply changes to datastore entities %s", err.Error())
			return nil, revision, err
		}

		// The new revision has landed
		revision += 1

		if truncated {
			logging.Infof(ctx, "going for another round to push the rest of the groups")
			clock.Sleep(ctx, 5*time.Second)
			continue
		}

		logging.Infof(ctx, "Done")
		break
	}

	if len(updatedGroups) > 0 {
		return updatedGroups.ToSortedSlice(), int64(revision), nil
	}

	return nil, 0, nil
}

// prepareImport compares the bundle given to the what is currently present in datastore
// to get the operations for all the groups.
func prepareImport(ctx context.Context, systemName string, existingGroups map[string]*AuthGroup, iGroups GroupBundle) (toPut []*AuthGroup, toDel []*AuthGroup) {
	systemGroups := []string{}
	iGroupsSet := stringset.New(len(iGroups))
	for gID := range existingGroups {
		if strings.HasPrefix(gID, fmt.Sprintf("%s/", systemName)) {
			systemGroups = append(systemGroups, gID)
		}
	}

	for groupName := range iGroups {
		iGroupsSet.Add(groupName)
	}

	sysGroupsSet := stringset.NewFromSlice(systemGroups...)

	toCreate := iGroupsSet.Difference(sysGroupsSet).ToSlice()
	for _, g := range toCreate {
		group := makeAuthGroup(ctx, g)
		group.Members = identitiesToStrings(iGroups[g])
		toPut = append(toPut, group)
	}

	toUpdate := sysGroupsSet.Intersect(iGroupsSet).ToSlice()
	for _, g := range toUpdate {
		importGMems := stringset.NewFromSlice(identitiesToStrings(iGroups[g])...)
		existMems := existingGroups[g].Members
		if !(len(importGMems) == len(existMems) && importGMems.HasAll(existMems...)) {
			group := makeAuthGroup(ctx, g)
			group.Members = importGMems.ToSlice()
			toPut = append(toPut, group)
		}
	}

	toDelete := sysGroupsSet.Difference(iGroupsSet).ToSlice()
	for _, g := range toDelete {
		group := makeAuthGroup(ctx, g)
		toDel = append(toDel, group)
	}

	return toPut, toDel
}

func identitiesToStrings(idents []identity.Identity) []string {
	res := make([]string, len(idents))
	for i, id := range idents {
		res[i] = string(id)
	}
	return res
}

// extractTarArchive unpacks a tar archive and returns a map
// of filename -> fileobj pairs.
func extractTarArchive(r io.Reader) (map[string][]byte, error) {
	entries := make(map[string][]byte)
	gzr, err := gzip.NewReader(r)
	if err != nil {
		return nil, err
	}

	tr := tar.NewReader(gzr)
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		fileContents, err := io.ReadAll(tr)
		if err != nil {
			return nil, err
		}
		entries[header.Name] = fileContents
	}

	if err := gzr.Close(); err != nil {
		return nil, err
	}
	return entries, nil
}

// TODO(cjacomet): replace with slices.Contains when
// slices package isn't experimental.
func contains(key string, search []string) bool {
	for _, val := range search {
		if val == key {
			return true
		}
	}
	return false
}

// ToProto converts the GroupImporterConfig entity to the proto equivalent.
func (g *GroupImporterConfig) ToProto() (*configspb.GroupImporterConfig, error) {
	gConfig := &configspb.GroupImporterConfig{}
	if err := prototext.Unmarshal([]byte(g.ConfigProto), gConfig); err != nil {
		return nil, err
	}
	return gConfig, nil
}
