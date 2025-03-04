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

import { RouteErrorDisplay } from '@/common/components/error_handling';

/**
 * Let the server handle the navigation request.
 */
export function ServerPage() {
  // Trigger navigation to itself so we can let the server handle the navigation
  // request and therefore escapes react-router's control.
  // eslint-disable-next-line no-self-assign
  self.location.href = self.location.href;

  return <></>;
}

export const element = <ServerPage />;

// Cannot use `<RecoverableErrorBoundary />` here because it requires the
// auth state provider.
export const errorElement = <RouteErrorDisplay />;
