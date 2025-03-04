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

import { EditorConfiguration, ModeSpec } from 'codemirror';
import { useRef } from 'react';
import { useLatest } from 'react-use';

import { PropertyViewerConfigInstance } from '@/common/store/user_config/build_config';
import { CodeMirrorEditor } from '@/generic_libs/components/code_mirror_editor';

export interface PropertyViewerProps {
  readonly properties: { readonly [key: string]: unknown };
  readonly config: PropertyViewerConfigInstance;
  readonly onInit?: (editor: CodeMirror.Editor) => void;
}

export function PropertyViewer({
  properties,
  config,
  onInit,
}: PropertyViewerProps) {
  const configRef = useLatest(config);
  const formattedValue = JSON.stringify(properties, undefined, 2);

  // Ensure the callbacks always refer to the latest values.
  const formattedValueLines = useLatest(formattedValue.split('\n'));
  const editorOptions = useRef<EditorConfiguration>({
    mode: { name: 'javascript', json: true } as ModeSpec<{ json: boolean }>,
    readOnly: true,
    matchBrackets: true,
    lineWrapping: true,
    foldGutter: true,
    lineNumbers: true,
    // Ensures all nodes are rendered therefore searchable.
    viewportMargin: Infinity,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
  });

  function setFolded(lineNum: number, folded: boolean) {
    const line = formattedValueLines.current[lineNum];
    // Not a root-level key, ignore.
    if (!line.startsWith('  "')) {
      return;
    }
    configRef.current.setFolded(line, folded);
  }

  return (
    <CodeMirrorEditor
      value={formattedValue}
      initOptions={editorOptions.current}
      onInit={(editor: CodeMirror.Editor) => {
        editor.on('fold', (_, from) => setFolded(from.line, true));
        editor.on('unfold', (_, from) => setFolded(from.line, false));

        editor.on('changes', () => {
          formattedValueLines.current.forEach((line, lineIndex) => {
            if (configRef.current.isFolded(line)) {
              // This also triggers the fold event listener above. This helps
              // keeping the keys fresh.
              editor.foldCode(lineIndex, undefined, 'fold');
            }
          });
        });
        onInit?.(editor);
      }}
      css={{
        '& .CodeMirror-scroll': {
          minWidth: '400px',
          maxWidth: '1000px',
          minHeight: '100px',
          maxHeight: '600px',
        },
      }}
    />
  );
}
