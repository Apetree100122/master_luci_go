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

import { render, screen } from '@testing-library/react';

import { GitCommit } from '@/common/services/milo_internal';

import { BlamelistTable } from './blamelist_table';

function makeCommit(id: string): GitCommit {
  return {
    id,
    tree: '1234567890abcdef',
    parents: ['1234567890abcdee'],
    author: {
      name: 'author',
      email: 'author@email.com',
      time: '2022-02-02T23:22:22Z',
    },
    committer: {
      name: 'committer',
      email: 'committer@email.com',
      time: '2022-02-02T23:22:22Z',
    },
    message: 'this is a commit\ndescription\n',
    treeDiff: [],
  };
}

describe('BlamelistTable', () => {
  it('can assign the commit numbers correctly', () => {
    render(
      <BlamelistTable
        repoUrl="https://repo.url"
        pages={[
          {
            commits: [
              makeCommit('commit1'),
              makeCommit('commit2'),
              makeCommit('commit3'),
            ],
          },
          {
            commits: [makeCommit('commit4'), makeCommit('commit5')],
          },
          {
            commits: [makeCommit('commit6')],
          },
        ]}
      />,
    );

    expect(screen.getByText('commit1').closest('tr')).toHaveTextContent('1.');
    expect(screen.getByText('commit2').closest('tr')).toHaveTextContent('2.');
    expect(screen.getByText('commit3').closest('tr')).toHaveTextContent('3.');
    expect(screen.getByText('commit4').closest('tr')).toHaveTextContent('4.');
    expect(screen.getByText('commit5').closest('tr')).toHaveTextContent('5.');
    expect(screen.getByText('commit6').closest('tr')).toHaveTextContent('6.');
  });
});
