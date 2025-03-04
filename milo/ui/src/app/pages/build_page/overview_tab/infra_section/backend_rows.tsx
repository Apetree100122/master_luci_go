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

import { Icon, Link } from '@mui/material';

import {
  BUILD_STATUS_COLOR_MAP,
  BUILD_STATUS_DISPLAY_MAP,
  BUILD_STATUS_ICON_MAP,
} from '@/common/constants/legacy';
import { BuildInfraBackend } from '@/common/services/buildbucket';

export interface BackendRowsProps {
  readonly backend: BuildInfraBackend;
}

export function BackendRows({ backend }: BackendRowsProps) {
  const task = backend.task;
  const config = backend.config;

  return (
    <>
      <tr>
        <td>Backend Target:</td>
        <td>{task.id.target}</td>
      </tr>
      <tr>
        <td>Backend Task:</td>
        <td>
          <Icon
            sx={{
              color: BUILD_STATUS_COLOR_MAP[task.status],
              verticalAlign: 'bottom',
            }}
            title={BUILD_STATUS_DISPLAY_MAP[task.status]}
            fontSize="small"
          >
            {BUILD_STATUS_ICON_MAP[task.status]}
          </Icon>{' '}
          {task.link ? (
            <Link href={task.link} target="_blank" rel="noopener">
              {task.id.id}
            </Link>
          ) : (
            task.id.id
          )}
        </td>
      </tr>
      {typeof config['service_account'] === 'string' && (
        <tr>
          <td>Service Account:</td>
          <td>{config['service_account']}</td>
        </tr>
      )}
    </>
  );
}
