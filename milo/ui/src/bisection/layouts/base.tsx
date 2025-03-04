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

import { Outlet, useParams } from 'react-router-dom';

import { RecoverableErrorBoundary } from '@/common/components/error_handling';
import { PageMeta } from '@/common/components/page_meta';
import { UiPage } from '@/common/constants/view';

export const BisectionLayout = () => {
  const { project } = useParams();

  if (!project) {
    throw new Error('invariant violated: project should be set');
  }
  return (
    <>
      <PageMeta
        project={project}
        title="Bisection"
        selectedPage={UiPage.Bisection}
      />
      <Outlet />
    </>
  );
};

export const element = (
  // See the documentation for `<LoginPage />` for why we handle error this way.
  <RecoverableErrorBoundary key="bisection">
    <BisectionLayout />
  </RecoverableErrorBoundary>
);
