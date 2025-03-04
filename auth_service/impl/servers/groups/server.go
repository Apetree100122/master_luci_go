// Copyright 2021 The LUCI Authors.
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

// Package groups contains Groups server implementation.
package groups

import (
	"context"
	"errors"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	"go.chromium.org/luci/auth_service/api/rpcpb"
	"go.chromium.org/luci/auth_service/impl/model"
	"go.chromium.org/luci/auth_service/impl/model/graph"
	"go.chromium.org/luci/gae/service/datastore"
	"go.chromium.org/luci/server/auth"
)

// Server implements Groups server.
type Server struct {
	rpcpb.UnimplementedGroupsServer
}

// ListGroups implements the corresponding RPC method.
func (*Server) ListGroups(ctx context.Context, _ *emptypb.Empty) (*rpcpb.ListGroupsResponse, error) {
	// Get groups from datastore.
	groups, err := model.GetAllAuthGroups(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to fetch groups: %s", err)
	}

	var groupList = make([]*rpcpb.AuthGroup, len(groups))
	for idx, entity := range groups {
		groupList[idx] = entity.ToProto(false)
	}

	return &rpcpb.ListGroupsResponse{
		Groups: groupList,
	}, nil
}

// GetGroup implements the corresponding RPC method.
func (*Server) GetGroup(ctx context.Context, request *rpcpb.GetGroupRequest) (*rpcpb.AuthGroup, error) {
	switch group, err := model.GetAuthGroup(ctx, request.Name); {
	case err == nil:
		return group.ToProto(true), nil
	case err == datastore.ErrNoSuchEntity:
		return nil, status.Errorf(codes.NotFound, "no such group %q", request.Name)
	default:
		return nil, status.Errorf(codes.Internal, "failed to fetch group %q: %s", request.Name, err)
	}
}

// CreateGroup implements the corresponding RPC method.
func (*Server) CreateGroup(ctx context.Context, request *rpcpb.CreateGroupRequest) (*rpcpb.AuthGroup, error) {
	group := model.AuthGroupFromProto(ctx, request.GetGroup())
	switch createdGroup, err := model.CreateAuthGroup(ctx, group, false, "Go pRPC API"); {
	case err == nil:
		return createdGroup.ToProto(true), nil
	case errors.Is(err, model.ErrAlreadyExists):
		return nil, status.Errorf(codes.AlreadyExists, "group already exists: %s", err)
	case errors.Is(err, model.ErrInvalidName):
		return nil, status.Errorf(codes.InvalidArgument, "invalid group name: %s", err)
	case errors.Is(err, model.ErrInvalidReference):
		return nil, status.Errorf(codes.InvalidArgument, "invalid group reference: %s", err)
	case errors.Is(err, model.ErrInvalidIdentity):
		return nil, status.Errorf(codes.InvalidArgument, "%s", err)
	default:
		return nil, status.Errorf(codes.Internal, "failed to create group %q: %s", request.GetGroup().GetName(), err)
	}
}

// UpdateGroup implements the corresponding RPC method.
func (*Server) UpdateGroup(ctx context.Context, request *rpcpb.UpdateGroupRequest) (*rpcpb.AuthGroup, error) {
	groupUpdate := model.AuthGroupFromProto(ctx, request.GetGroup())
	switch updatedGroup, err := model.UpdateAuthGroup(ctx, groupUpdate, request.GetUpdateMask(), request.GetGroup().GetEtag(), false, "Go pRPC API"); {
	case err == nil:
		return updatedGroup.ToProto(true), nil
	case errors.Is(err, datastore.ErrNoSuchEntity):
		return nil, status.Errorf(codes.NotFound, "no such group %q", groupUpdate.ID)
	case errors.Is(err, model.ErrPermissionDenied):
		return nil, status.Errorf(codes.PermissionDenied, "%s does not have permission to update group %q: %s", auth.CurrentIdentity(ctx), groupUpdate.ID, err)
	case errors.Is(err, model.ErrConcurrentModification):
		return nil, status.Error(codes.Aborted, err.Error())
	case errors.Is(err, model.ErrInvalidReference):
		return nil, status.Errorf(codes.InvalidArgument, "invalid group reference: %s", err)
	case errors.Is(err, model.ErrInvalidArgument):
		return nil, status.Error(codes.InvalidArgument, err.Error())
	case errors.Is(err, model.ErrInvalidIdentity):
		return nil, status.Error(codes.InvalidArgument, err.Error())
	case errors.Is(err, model.ErrCyclicDependency):
		return nil, status.Error(codes.FailedPrecondition, err.Error())
	default:
		return nil, status.Errorf(codes.Internal, "failed to update group %q: %s", request.GetGroup().GetName(), err)
	}
}

// DeleteGroup implements the corresponding RPC method.
func (*Server) DeleteGroup(ctx context.Context, request *rpcpb.DeleteGroupRequest) (*emptypb.Empty, error) {
	name := request.GetName()
	switch err := model.DeleteAuthGroup(ctx, name, request.GetEtag(), false, "Go pRPC API"); {
	case err == nil:
		return &emptypb.Empty{}, nil
	case errors.Is(err, datastore.ErrNoSuchEntity):
		return nil, status.Errorf(codes.NotFound, "no such group %q", name)
	case errors.Is(err, model.ErrPermissionDenied):
		return nil, status.Errorf(codes.PermissionDenied, "%s does not have permission to delete group %q: %s", auth.CurrentIdentity(ctx), name, err)
	case errors.Is(err, model.ErrConcurrentModification):
		return nil, status.Error(codes.Aborted, err.Error())
	case errors.Is(err, model.ErrReferencedEntity):
		return nil, status.Error(codes.FailedPrecondition, err.Error())
	// TODO(cjacomet): Handle context cancelled and internal errors in a more general way with logging.
	case errors.Is(err, context.Canceled):
		return nil, status.Error(codes.Canceled, err.Error())
	default:
		return nil, status.Errorf(codes.Internal, "failed to delete group %q: %s", name, err)
	}
}

// GetSubgraph implements the corresponding RPC method.
//
// Possible Errors:
//
//	Internal error for datastore access issues.
//	NotFound error wrapping a graph.ErrNoSuchGroup if group is not present in groups graph.
//	InvalidArgument error if the PrincipalKind is unspecified.
//	Annotated error if the subgraph building fails, this may be an InvalidArgument or NotFound error.
func (*Server) GetSubgraph(ctx context.Context, request *rpcpb.GetSubgraphRequest) (*rpcpb.Subgraph, error) {
	// Get groups from datastore.
	groups, err := model.GetAllAuthGroups(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to fetch groups %s", err)
	}

	// Build groups graph from groups in datastore.
	groupsGraph := graph.NewGraph(groups)

	principal, err := convertPrincipal(request.Principal)
	if err != nil {
		return nil, err
	}

	subgraph, err := groupsGraph.GetRelevantSubgraph(principal)
	if err != nil {
		return nil, err
	}

	subgraphProto := subgraph.ToProto()
	return subgraphProto, nil
}

// convertPrincipal handles the conversion of rpcpb.Principal -> graph.NodeKey
func convertPrincipal(p *rpcpb.Principal) (graph.NodeKey, error) {
	switch p.Kind {
	case rpcpb.PrincipalKind_GLOB:
		return graph.NodeKey{Kind: graph.Glob, Value: p.Name}, nil
	case rpcpb.PrincipalKind_IDENTITY:
		return graph.NodeKey{Kind: graph.Identity, Value: p.Name}, nil
	case rpcpb.PrincipalKind_GROUP:
		return graph.NodeKey{Kind: graph.Group, Value: p.Name}, nil
	default:
		return graph.NodeKey{}, status.Errorf(codes.InvalidArgument, "invalid principal kind")
	}
}
