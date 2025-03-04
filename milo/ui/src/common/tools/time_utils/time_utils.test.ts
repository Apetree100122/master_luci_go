// Copyright 2020 The LUCI Authors.
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

import { Duration } from 'luxon';

import { displayCompactDuration, displayDuration } from './time_utils';

describe('displayDuration', () => {
  test('should display correct duration in days and hours', async () => {
    const duration = Duration.fromISO('P3DT11H');
    expect(displayDuration(duration)).toStrictEqual('3 days 11 hours');
  });
  test('should display correct duration in hours and minutes', async () => {
    const duration = Duration.fromISO('PT1H11M');
    expect(displayDuration(duration)).toStrictEqual('1 hour 11 mins');
  });
  test('should display correct duration in minutes and seconds', async () => {
    const duration = Duration.fromISO('PT2M3S');
    expect(displayDuration(duration)).toStrictEqual('2 mins 3 secs');
  });
  test('should display correct duration in seconds', async () => {
    const duration = Duration.fromISO('PT15S');
    expect(displayDuration(duration)).toStrictEqual('15 secs');
  });
  test('should display correct duration in milliseconds', async () => {
    const duration = Duration.fromMillis(999);
    expect(displayDuration(duration)).toStrictEqual('999 ms');
  });
  test('should ignore milliseconds if duration > 1 second', async () => {
    const duration = Duration.fromMillis(1999);
    expect(displayDuration(duration)).toStrictEqual('1 sec');
  });
  test('should display zero duration correctly', async () => {
    const duration = Duration.fromMillis(0);
    expect(displayDuration(duration)).toStrictEqual('0 ms');
  });
});

describe('displayCompactDuration', () => {
  test("should display correct duration when it's null", async () => {
    expect(displayCompactDuration(null)).toEqual(['N/A', '']);
  });
  test('should display correct duration in days', async () => {
    const duration = Duration.fromISO('P3DT11H');
    expect(displayCompactDuration(duration)).toEqual(['3.5d', 'd']);
  });
  test('should display correct duration in hours', async () => {
    const duration = Duration.fromISO('PT1H11M');
    expect(displayCompactDuration(duration)).toEqual(['1.2h', 'h']);
  });
  test('should display correct duration in minutes', async () => {
    const duration = Duration.fromISO('PT2M3S');
    expect(displayCompactDuration(duration)).toEqual(['2.0m', 'm']);
  });
  test('should display correct duration in seconds', async () => {
    const duration = Duration.fromISO('PT15S');
    expect(displayCompactDuration(duration)).toEqual(['15s', 's']);
  });
  test('should display correct duration in milliseconds', async () => {
    const duration = Duration.fromMillis(999);
    expect(displayCompactDuration(duration)).toEqual(['999ms', 'ms']);
  });
  test("should not display the duration in ms if it's no less than 999.5ms", async () => {
    const duration = Duration.fromMillis(999.5);
    expect(displayCompactDuration(duration)).toEqual(['1.0s', 's']);
  });
  test("should display the duration in ms if it's less than 999.5ms", async () => {
    const duration = Duration.fromMillis(999.4999);
    expect(displayCompactDuration(duration)).toEqual(['999ms', 'ms']);
  });
});
