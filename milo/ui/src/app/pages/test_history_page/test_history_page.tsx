// Copyright 2023 The LUCI Authors.
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

import styled from '@emotion/styled';
import { LinearProgress } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { RecoverableErrorBoundary } from '@/common/components/error_handling';
import { PageMeta } from '@/common/components/page_meta';
import { UiPage } from '@/common/constants/view';
import { useStore } from '@/common/store';
import { GraphType } from '@/common/store/test_history_page';
import { extractProject } from '@/common/tools/utils';
import { useSyncedSearchParams } from '@/generic_libs/hooks/synced_search_params';

import { DateAxis } from './date_axis';
import { DurationGraph } from './duration_graph';
import { DurationLegend } from './duration_legend';
import { FilterBox } from './filter_box';
import { GraphConfig } from './graph_config';
import { StatusGraph } from './status_graph';
import { TestIdLabel } from './test_id_label';
import { TestPropertiesEntry } from './test_properties_entry';
import { VariantCounts } from './variant_counts';
import { VariantDefTable } from './variant_def_table';
import { VerdictDetailsDialog } from './verdict_details_dialog';

/**
 * Maps graph type to the corresponding component.
 */
const GRAPH_TYPE_COMPONENT_MAP = {
  [GraphType.DURATION]: DurationGraph,
  [GraphType.STATUS]: StatusGraph,
};

const PageContainer = styled.div({
  display: 'grid',
  width: '100%',
  minWidth: '800px',
  gridTemplateRows: 'auto auto 1fr',
});

const GraphContainer = styled.div({
  display: 'grid',
  margin: '0 5px',
  gridTemplateColumns: 'auto 1fr auto',
  gridTemplateRows: 'auto 1fr',
  gridTemplateAreas: `
  'v-table graph extra'`,
});

export const TestHistoryPage = observer(() => {
  const { projectOrRealm, testId } = useParams();
  const [searchParams, setSearchParams] = useSyncedSearchParams();

  // Use useState to ensure initialFilterText won't change after search params
  // are updated.
  const [initialFilterText] = useState(() => searchParams.get('q') || '');

  const store = useStore();
  const pageState = store.testHistoryPage;

  if (!projectOrRealm || !testId) {
    throw new Error('invariant violated: realm and testId should be set');
  }

  useEffect(() => {
    pageState.setParams(projectOrRealm, testId);
  }, [pageState, projectOrRealm, testId]);

  useEffect(() => {
    if (!initialFilterText) {
      return;
    }
    pageState.setFilterText(initialFilterText);
  }, [pageState, initialFilterText]);

  // Update the querystring when filters are updated.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!pageState.filterText) {
          next.delete('q');
        } else {
          next.set('q', pageState.filterText);
        }
        return next;
      },
      { replace: true },
    );
  }, [pageState.filterText, setSearchParams]);

  useEffect(() => {
    pageState.entriesLoader?.loadFirstPage();
  }, [pageState.entriesLoader]);

  useEffect(() => {
    pageState.variantsLoader?.loadFirstPage();
  }, [pageState.variantsLoader]);

  const Graph = GRAPH_TYPE_COMPONENT_MAP[pageState.graphType];

  const project = extractProject(projectOrRealm);

  return (
    <PageContainer>
      <PageMeta
        project={project}
        title="Test history"
        selectedPage={UiPage.TestHistory}
      />
      <div
        css={{
          width: '100%',
          backgroundColor: 'var(--block-background-color)',
          padding: '6px 16px',
          fontFamily: "'Google Sans', 'Helvetica Neue', sans-serif",
          fontSize: '14px',
        }}
      >
        <TestIdLabel projectOrRealm={projectOrRealm} testId={testId} />
        <TestPropertiesEntry projectOrRealm={projectOrRealm} testId={testId} />
      </div>
      <LinearProgress value={100} variant="determinate" />
      <FilterBox
        css={{ width: 'calc(100% - 10px)', margin: '5px' }}
        initialFilterText={initialFilterText}
      />
      <GraphConfig />
      <GraphContainer>
        <VariantDefTable css={{ gridArea: 'v-table' }} />
        <div css={{ gridArea: 'graph', overflow: 'scroll' }}>
          <DateAxis css={{ width: '2600px' }} />
          <Graph css={{ width: '2600px' }} />
        </div>
        {pageState.graphType === GraphType.DURATION && (
          <DurationLegend css={{ gridArea: 'extra', marginLeft: '20px' }} />
        )}
      </GraphContainer>
      <div css={{ padding: '5px' }}>
        <VariantCounts />
      </div>
      <VerdictDetailsDialog />
      {/* Add padding to support free scrolling when the dialog is open. */}
      {!pageState.selectedGroup && (
        <div css={{ width: '100%', height: '60vh' }} />
      )}
    </PageContainer>
  );
});

export const element = (
  // See the documentation for `<LoginPage />` for why we handle error this way.
  <RecoverableErrorBoundary key="test-history">
    <TestHistoryPage />
  </RecoverableErrorBoundary>
);
