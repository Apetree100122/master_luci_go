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

import { render } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { DateTime } from 'luxon';
import { action, computed, makeAutoObservable } from 'mobx';
import { destroy } from 'mobx-state-tree';

import { Build, BuildbucketStatus, Step } from '@/common/services/buildbucket';
import { renderMarkdown } from '@/common/tools/markdown/utils';

import {
  BuildState,
  BuildStateInstance,
  clusterBuildSteps,
  StepExt,
} from './build_state';

describe('StepExt', () => {
  function createStep(
    index: number,
    name: string,
    status = BuildbucketStatus.Success,
    summaryMarkdown = '',
    children: StepExt[] = [],
  ) {
    const nameSegs = name.split('|');
    const step = new StepExt({
      step: {
        name,
        startTime: '2020-11-01T21:43:03.351951Z',
        status,
        summaryMarkdown,
      },
      listNumber: '1.1',
      selfName: nameSegs.pop()!,
      depth: nameSegs.length,
      index,
    });
    step.children.push(...children);
    return step;
  }

  describe('succeededRecursively/failed', () => {
    test('succeeded step with no children', async () => {
      const step = createStep(0, 'parent', BuildbucketStatus.Success);
      expect(step.succeededRecursively).toBeTruthy();
      expect(step.failed).toBeFalsy();
    });

    test('failed step with no children', async () => {
      const step = createStep(0, 'parent', BuildbucketStatus.Failure);
      expect(step.succeededRecursively).toBeFalsy();
      expect(step.failed).toBeTruthy();
    });

    test('infra-failed step with no children', async () => {
      const step = createStep(0, 'parent', BuildbucketStatus.InfraFailure);
      expect(step.succeededRecursively).toBeFalsy();
      expect(step.failed).toBeTruthy();
    });

    test('non-(infra-)failed step with no children', async () => {
      const step = createStep(0, 'parent', BuildbucketStatus.Canceled);
      expect(step.succeededRecursively).toBeFalsy();
      expect(step.failed).toBeFalsy();
    });

    test('succeeded step with only succeeded children', async () => {
      const step = createStep(0, 'parent', BuildbucketStatus.Success, '', [
        createStep(0, 'parent|child1', BuildbucketStatus.Success),
        createStep(1, 'parent|child2', BuildbucketStatus.Success),
      ]);
      expect(step.succeededRecursively).toBeTruthy();
      expect(step.failed).toBeFalsy();
    });

    test('succeeded step with failed child', async () => {
      const step = createStep(0, 'parent', BuildbucketStatus.Success, '', [
        createStep(0, 'parent|child1', BuildbucketStatus.Success),
        createStep(1, 'parent|child2', BuildbucketStatus.Failure),
      ]);
      expect(step.succeededRecursively).toBeFalsy();
      expect(step.failed).toBeTruthy();
    });

    test('succeeded step with non-succeeded child', async () => {
      const step = createStep(0, 'parent', BuildbucketStatus.Success, '', [
        createStep(0, 'parent|child1', BuildbucketStatus.Success),
        createStep(1, 'parent|child2', BuildbucketStatus.Started),
      ]);
      expect(step.succeededRecursively).toBeFalsy();
      expect(step.failed).toBeFalsy();
    });

    test('failed step with succeeded children', async () => {
      const step = createStep(0, 'parent', BuildbucketStatus.Failure, '', [
        createStep(0, 'parent|child1', BuildbucketStatus.Success),
        createStep(1, 'parent|child2', BuildbucketStatus.Success),
      ]);
      expect(step.succeededRecursively).toBeFalsy();
      expect(step.failed).toBeTruthy();
    });

    test('infra-failed step with succeeded children', async () => {
      const step = createStep(0, 'parent', BuildbucketStatus.InfraFailure, '', [
        createStep(0, 'parent|child1', BuildbucketStatus.Success),
        createStep(1, 'parent|child2', BuildbucketStatus.Success),
      ]);
      expect(step.succeededRecursively).toBeFalsy();
      expect(step.failed).toBeTruthy();
    });
  });

  describe('summary header and content should be split properly', () => {
    function getExpectedHeaderHTML(markdownBody: string): string {
      const container = document.createElement('div');
      // Wrap in a <p> and remove it later so <!----> are not injected.
      render(unsafeHTML(renderMarkdown(`<p>${markdownBody}</p>`)), container);
      return container.firstElementChild!.innerHTML;
    }

    function getExpectedBodyHTML(markdownBody: string): string {
      const container = document.createElement('div');
      render(unsafeHTML(renderMarkdown(markdownBody)), container);
      return container.innerHTML;
    }

    test('for no summary', async () => {
      const step = createStep(0, 'step', BuildbucketStatus.Success, undefined);
      expect(step.header).toBeNull();
      expect(step.summary).toBeNull();
    });

    test('for empty summary', async () => {
      const step = createStep(0, 'step', BuildbucketStatus.Success, '');
      expect(step.header).toBeNull();
      expect(step.summary).toBeNull();
    });

    test('for text summary', async () => {
      const step = createStep(
        0,
        'step',
        BuildbucketStatus.Success,
        'this is some text',
      );
      expect(step.header?.innerHTML).toStrictEqual('this is some text');
      expect(step.summary).toBeNull();
    });

    test('for header and content separated by <br/>', async () => {
      const step = createStep(
        0,
        'step',
        BuildbucketStatus.Success,
        'header<br/>content',
      );
      expect(step.header?.innerHTML).toStrictEqual(
        getExpectedHeaderHTML('header'),
      );
      expect(step.summary?.innerHTML).toStrictEqual(
        getExpectedBodyHTML('content'),
      );
    });

    test('for header and content separated by <br/>, header is empty', async () => {
      const step = createStep(
        0,
        'step',
        BuildbucketStatus.Success,
        '<br/>body',
      );
      expect(step.header).toBeNull();
      expect(step.summary?.innerHTML).toStrictEqual(
        getExpectedBodyHTML('body'),
      );
    });

    test('for header and content separated by <br/>, body is empty', async () => {
      const step = createStep(
        0,
        'step',
        BuildbucketStatus.Success,
        'header<br/>',
      );
      expect(step.header?.innerHTML).toStrictEqual(
        getExpectedHeaderHTML('header'),
      );
      expect(step.summary).toBeNull();
    });

    test('for header and content separated by <br/>, header is a link', async () => {
      const step = createStep(
        0,
        'step',
        BuildbucketStatus.Success,
        '<a href="http://google.com">Link</a><br/>content',
      );
      expect(step.header?.innerHTML).toStrictEqual(
        getExpectedHeaderHTML('<a href="http://google.com">Link</a>'),
      );
      expect(step.summary?.innerHTML).toStrictEqual(
        getExpectedBodyHTML('content'),
      );
    });

    test('for header and content separated by <br/>, header has some inline elements', async () => {
      const step = createStep(
        0,
        'step',
        BuildbucketStatus.Success,
        '<span>span</span><i>i</i><b>b</b><strong>strong</strong><br/>content',
      );
      expect(step.header?.innerHTML).toStrictEqual(
        getExpectedHeaderHTML(
          '<span>span</span><i>i</i><b>b</b><strong>strong</strong>',
        ),
      );
      expect(step.summary?.innerHTML).toStrictEqual(
        getExpectedBodyHTML('content'),
      );
    });

    test('for header and content separated by <br/>, header is a list', async () => {
      const step = createStep(
        0,
        'step',
        BuildbucketStatus.Success,
        '<ul><li>item</li></ul><br/>content',
      );
      expect(step.header).toBeNull();
      expect(step.summary?.innerHTML).toStrictEqual(
        getExpectedBodyHTML('<ul><li>item</li></ul><br/>content'),
      );
    });

    test('for header is a list', async () => {
      const step = createStep(
        0,
        'step',
        BuildbucketStatus.Success,
        '<ul><li>item1</li><li>item2</li></ul>',
      );
      expect(step.header).toBeNull();
      expect(step.summary?.innerHTML).toStrictEqual(
        getExpectedBodyHTML('<ul><li>item1</li><li>item2</li></ul>'),
      );
    });

    test('for <br/> is contained in <div>', async () => {
      const step = createStep(
        0,
        'step',
        BuildbucketStatus.Success,
        '<div>header<br/>other</div>content',
      );
      expect(step.header?.innerHTML).toStrictEqual(
        getExpectedHeaderHTML('header'),
      );
      expect(step.summary?.innerHTML).toStrictEqual(
        getExpectedBodyHTML('<div>other</div>content'),
      );
    });

    test('for <br/> is contained in some nested tags', async () => {
      const step = createStep(
        0,
        'step',
        BuildbucketStatus.Success,
        '<div><div>header<br/>other</div></div>content',
      );
      expect(step.header).toBeNull();
      expect(step.summary?.innerHTML).toStrictEqual(
        getExpectedBodyHTML('<div><div>header<br/>other</div></div>content'),
      );
    });
  });
});

describe('clusterBuildSteps', () => {
  function createStep(id: number, isCritical: boolean) {
    return {
      id,
      isCritical,
    } as Partial<StepExt> as StepExt;
  }

  test('should cluster build steps correctly', () => {
    const clusteredSteps = clusterBuildSteps([
      createStep(1, false),
      createStep(2, false),
      createStep(3, false),
      createStep(4, true),
      createStep(5, false),
      createStep(6, false),
      createStep(7, true),
      createStep(8, true),
      createStep(9, false),
      createStep(10, true),
      createStep(11, true),
    ]);
    expect(clusteredSteps).toEqual([
      [createStep(1, false), createStep(2, false), createStep(3, false)],
      [createStep(4, true)],
      [createStep(5, false), createStep(6, false)],
      [createStep(7, true), createStep(8, true)],
      [createStep(9, false)],
      [createStep(10, true), createStep(11, true)],
    ]);
  });

  test("should cluster build steps correctly when there're no steps", () => {
    const clusteredSteps = clusterBuildSteps([]);
    expect(clusteredSteps).toEqual([]);
  });

  test("should cluster build steps correctly when there's a single step", () => {
    const clusteredSteps = clusterBuildSteps([createStep(1, false)]);
    expect(clusteredSteps).toEqual([[createStep(1, false)]]);
  });

  test('should not re-cluster steps when the criticality is updated', () => {
    const step1 = makeAutoObservable(createStep(1, false));
    const step2 = makeAutoObservable(createStep(2, false));
    const step3 = makeAutoObservable(createStep(3, false));

    const computedCluster = computed(
      () => clusterBuildSteps([step1, step2, step3]),
      { keepAlive: true },
    );

    const clustersBeforeUpdate = clusterBuildSteps([step1, step2, step3]);
    expect(clustersBeforeUpdate).toEqual([[step1, step2, step3]]);
    expect(computedCluster.get()).toEqual(clustersBeforeUpdate);

    action(() => ((step2 as Mutable<typeof step2>).isCritical = true))();
    const clustersAfterUpdate = clusterBuildSteps([step1, step2, step3]);
    expect(clustersAfterUpdate).toEqual([[step1], [step2], [step3]]);

    expect(computedCluster.get()).toEqual(clustersBeforeUpdate);
  });
});

describe('BuildState', () => {
  let build: BuildStateInstance;
  afterEach(() => {
    destroy(build);
  });

  test('should build step-tree correctly', async () => {
    const time = '2020-11-01T21:43:03.351951Z';
    build = BuildState.create({
      data: {
        steps: [
          { name: 'root1', startTime: time } as Step,
          { name: 'root2', startTime: time },
          { name: 'root2|parent1', startTime: time },
          { name: 'root3', startTime: time },
          { name: 'root2|parent1|child1', startTime: time },
          { name: 'root3|parent1', startTime: time },
          { name: 'root2|parent1|child2', startTime: time },
          { name: 'root3|parent2', startTime: time },
          { name: 'root3|parent2|child1', startTime: time },
          { name: 'root3|parent2|child2', startTime: time },
        ] as readonly Step[],
      } as Build,
    });

    expect(build.rootSteps).toMatchObject([
      {
        name: 'root1',
        selfName: 'root1',
        listNumber: '1.',
        depth: 0,
        index: 0,
        children: [],
      } as Partial<StepExt>,
      {
        name: 'root2',
        selfName: 'root2',
        listNumber: '2.',
        depth: 0,
        index: 1,
        children: [
          {
            name: 'root2|parent1',
            selfName: 'parent1',
            listNumber: '2.1.',
            depth: 1,
            index: 0,
            children: [
              {
                name: 'root2|parent1|child1',
                selfName: 'child1',
                listNumber: '2.1.1.',
                depth: 2,
                index: 0,
                children: [],
              },
              {
                name: 'root2|parent1|child2',
                selfName: 'child2',
                listNumber: '2.1.2.',
                depth: 2,
                index: 1,
                children: [],
              },
            ],
          },
        ],
      },
      {
        name: 'root3',
        selfName: 'root3',
        listNumber: '3.',
        depth: 0,
        index: 2,
        children: [
          {
            name: 'root3|parent1',
            selfName: 'parent1',
            listNumber: '3.1.',
            depth: 1,
            index: 0,
            children: [],
          },
          {
            name: 'root3|parent2',
            selfName: 'parent2',
            listNumber: '3.2.',
            depth: 1,
            index: 1,
            children: [
              {
                name: 'root3|parent2|child1',
                selfName: 'child1',
                listNumber: '3.2.1.',
                depth: 2,
                index: 0,
                children: [],
              },
              {
                name: 'root3|parent2|child2',
                selfName: 'child2',
                listNumber: '3.2.2.',
                depth: 2,
                index: 1,
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  describe('should calculate pending/execution time/status correctly', () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });
    afterAll(() => {
      jest.useRealTimers();
    });

    test("when the build hasn't started", () => {
      jest.setSystemTime(DateTime.fromISO('2020-01-01T00:00:20Z').toMillis());
      build = BuildState.create({
        data: {
          status: BuildbucketStatus.Scheduled,
          createTime: '2020-01-01T00:00:10Z',
          schedulingTimeout: '20s',
          executionTimeout: '20s',
        } as Build,
      });

      expect(build.pendingDuration.toISO()).toStrictEqual('PT10S');
      expect(build.isPending).toBeTruthy();
      expect(build.exceededSchedulingTimeout).toBeFalsy();

      expect(build.executionDuration).toBeNull();
      expect(build.isExecuting).toBeFalsy();
      expect(build.exceededExecutionTimeout).toBeFalsy();
    });

    test('when the build was canceled before exceeding the scheduling timeout', () => {
      jest.setSystemTime(DateTime.fromISO('2020-01-01T00:00:50Z').toMillis());
      build = BuildState.create({
        data: {
          status: BuildbucketStatus.Canceled,
          createTime: '2020-01-01T00:00:10Z',
          endTime: '2020-01-01T00:00:20Z',
          schedulingTimeout: '20s',
          executionTimeout: '20s',
        } as Build,
      });

      expect(build.pendingDuration.toISO()).toStrictEqual('PT10S');
      expect(build.isPending).toBeFalsy();
      expect(build.exceededSchedulingTimeout).toBeFalsy();

      expect(build.executionDuration).toBeNull();
      expect(build.isExecuting).toBeFalsy();
      expect(build.exceededExecutionTimeout).toBeFalsy();
    });

    test('when the build was canceled after exceeding the scheduling timeout', () => {
      jest.setSystemTime(DateTime.fromISO('2020-01-01T00:00:50Z').toMillis());
      build = BuildState.create({
        data: {
          status: BuildbucketStatus.Canceled,
          createTime: '2020-01-01T00:00:10Z',
          endTime: '2020-01-01T00:00:30Z',
          schedulingTimeout: '20s',
          executionTimeout: '20s',
        } as Build,
      });

      expect(build.pendingDuration.toISO()).toStrictEqual('PT20S');
      expect(build.isPending).toBeFalsy();
      expect(build.exceededSchedulingTimeout).toBeTruthy();

      expect(build.executionDuration).toBeNull();
      expect(build.isExecuting).toBeFalsy();
      expect(build.exceededExecutionTimeout).toBeFalsy();
    });

    test('when the build was started', () => {
      jest.setSystemTime(DateTime.fromISO('2020-01-01T00:00:30Z').toMillis());
      build = BuildState.create({
        data: {
          status: BuildbucketStatus.Started,
          createTime: '2020-01-01T00:00:10Z',
          startTime: '2020-01-01T00:00:20Z',
          schedulingTimeout: '20s',
          executionTimeout: '20s',
        } as Build,
      });

      expect(build.pendingDuration.toISO()).toStrictEqual('PT10S');
      expect(build.isPending).toBeFalsy();
      expect(build.exceededSchedulingTimeout).toBeFalsy();

      expect(build.executionDuration?.toISO()).toStrictEqual('PT10S');
      expect(build.isExecuting).toBeTruthy();
      expect(build.exceededExecutionTimeout).toBeFalsy();
    });

    test('when the build was started and canceled before exceeding the execution timeout', () => {
      jest.setSystemTime(DateTime.fromISO('2020-01-01T00:00:40Z').toMillis());
      build = BuildState.create({
        data: {
          status: BuildbucketStatus.Canceled,
          createTime: '2020-01-01T00:00:10Z',
          startTime: '2020-01-01T00:00:20Z',
          endTime: '2020-01-01T00:00:30Z',
          schedulingTimeout: '20s',
          executionTimeout: '20s',
        } as Build,
      });

      expect(build.pendingDuration.toISO()).toStrictEqual('PT10S');
      expect(build.isPending).toBeFalsy();
      expect(build.exceededSchedulingTimeout).toBeFalsy();

      expect(build.executionDuration?.toISO()).toStrictEqual('PT10S');
      expect(build.isExecuting).toBeFalsy();
      expect(build.exceededExecutionTimeout).toBeFalsy();
    });

    test('when the build started and ended after exceeding the execution timeout', () => {
      jest.setSystemTime(DateTime.fromISO('2020-01-01T00:00:50Z').toMillis());
      build = BuildState.create({
        data: {
          status: BuildbucketStatus.Canceled,
          createTime: '2020-01-01T00:00:10Z',
          startTime: '2020-01-01T00:00:20Z',
          endTime: '2020-01-01T00:00:40Z',
          schedulingTimeout: '20s',
          executionTimeout: '20s',
        } as Build,
      });

      expect(build.pendingDuration.toISO()).toStrictEqual('PT10S');
      expect(build.isPending).toBeFalsy();
      expect(build.exceededSchedulingTimeout).toBeFalsy();

      expect(build.executionDuration?.toISO()).toStrictEqual('PT20S');
      expect(build.isExecuting).toBeFalsy();
      expect(build.exceededExecutionTimeout).toBeTruthy();
    });

    test("when the build wasn't started or canceled after the scheduling timeout", () => {
      jest.setSystemTime(DateTime.fromISO('2020-01-01T00:00:50Z').toMillis());
      build = BuildState.create({
        data: {
          status: BuildbucketStatus.Scheduled,
          createTime: '2020-01-01T00:00:10Z',
          schedulingTimeout: '20s',
          executionTimeout: '20s',
        } as Build,
      });

      expect(build.pendingDuration.toISO()).toStrictEqual('PT40S');
      expect(build.isPending).toBeTruthy();
      expect(build.exceededSchedulingTimeout).toBeFalsy();

      expect(build.executionDuration).toBeNull();
      expect(build.isExecuting).toBeFalsy();
      expect(build.exceededExecutionTimeout).toBeFalsy();
    });

    test('when the build was started after the scheduling timeout', () => {
      jest.setSystemTime(DateTime.fromISO('2020-01-01T00:00:50Z').toMillis());
      build = BuildState.create({
        data: {
          status: BuildbucketStatus.Started,
          createTime: '2020-01-01T00:00:10Z',
          startTime: '2020-01-01T00:00:40Z',
          schedulingTimeout: '20s',
          executionTimeout: '20s',
        } as Build,
      });

      expect(build.pendingDuration.toISO()).toStrictEqual('PT30S');
      expect(build.isPending).toBeFalsy();
      expect(build.exceededSchedulingTimeout).toBeFalsy();

      expect(build.executionDuration?.toISO()).toStrictEqual('PT10S');
      expect(build.isExecuting).toBeTruthy();
      expect(build.exceededExecutionTimeout).toBeFalsy();
    });

    test('when the build was not canceled after the execution timeout', () => {
      jest.setSystemTime(DateTime.fromISO('2020-01-01T00:01:10Z').toMillis());
      build = BuildState.create({
        data: {
          status: BuildbucketStatus.Success,
          createTime: '2020-01-01T00:00:10Z',
          startTime: '2020-01-01T00:00:40Z',
          endTime: '2020-01-01T00:01:10Z',
          schedulingTimeout: '20s',
          executionTimeout: '20s',
        } as Build,
      });

      expect(build.pendingDuration.toISO()).toStrictEqual('PT30S');
      expect(build.isPending).toBeFalsy();
      expect(build.exceededSchedulingTimeout).toBeFalsy();

      expect(build.executionDuration?.toISO()).toStrictEqual('PT30S');
      expect(build.isExecuting).toBeFalsy();
      expect(build.exceededExecutionTimeout).toBeFalsy();
    });
  });
});
