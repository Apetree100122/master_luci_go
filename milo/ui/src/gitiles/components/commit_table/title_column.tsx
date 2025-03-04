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

import { TableCell } from '@mui/material';

import { useCommit } from './context';

export function TitleHeadCell() {
  return <TableCell>Title</TableCell>;
}

export function TitleContentCell() {
  const commit = useCommit();
  const title = commit.message.split('\n', 1)[0];

  return (
    <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {title}
    </TableCell>
  );
}
