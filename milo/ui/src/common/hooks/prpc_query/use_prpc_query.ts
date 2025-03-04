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

import {
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from '@tanstack/react-query';

import {
  useAuthState,
  useGetAccessToken,
} from '@/common/components/auth_state_provider';
import { BinaryPrpcClient } from '@/generic_libs/tools/prpc_client';

import {
  PrpcMethod,
  PrpcMethodRequest,
  PrpcMethodResponse,
  PrpcQueryBaseOptions,
  PrpcServiceMethodKeys,
  genPrpcQueryKey,
} from './common';

export interface UsePrpcQueryOptions<S, MK, Req, Res, TError, TData>
  extends PrpcQueryBaseOptions<S, MK, Req> {
  /**
   * `options` will be passed to `useQuery` from `@tanstack/react-query`.
   */
  readonly options?: Omit<
    UseQueryOptions<
      Res,
      TError,
      TData,
      readonly [string, string, string, MK, Req]
    >,
    'queryKey' | 'queryFn'
  >;
}

/**
 * Call a pRPC method via `useQuery` from `@tanstack/react-query`.
 *
 * Example:
 * ```typescript
 * // The return type is the same as the return type of an equivalent `useQuery`
 * // call. i.e. react-query specific type narrowing also works here. The type
 * // of `data` is inferred from the supplied client implementation and method
 * // name.
 * const {data, isLoading, ...} = usePrpcQuery({
 *   // The host of the pRPC server.
 *   host: 'cr-buildbucket-dev.appspot.com',
 *   // The generic client generated by ts-proto.
 *   ClientImpl: BuildsClientImpl,
 *   // The pRPC method to be called. Must be a key of the class supplied to
 *   // `ClientImpl`.
 *   method: 'SearchBuilds',
 *   // A type checked request object. The type of the request object is
 *   // inferred from the supplied client implementation and method name.
 *   request: {
 *     ...
 *   },
 * })
 * ```
 *
 * Comparing to the regular `useQuery` hook, this hook
 *  * reduces boilerplate, and
 *  * ensures the `queryKey` is populated correctly.
 */
export function usePrpcQuery<
  Service extends object,
  MK extends PrpcServiceMethodKeys<Service>,
  TError = unknown,
  TData = PrpcMethodResponse<Service[MK]>,
>(
  opts: UsePrpcQueryOptions<
    Service,
    MK,
    PrpcMethodRequest<Service[MK]>,
    PrpcMethodResponse<Service[MK]>,
    TError,
    TData
  >,
): UseQueryResult<TData, TError> {
  const { host, insecure, ClientImpl, method, request, options } = opts;

  const { identity } = useAuthState();
  const getAuthToken = useGetAccessToken();
  const queryKey = genPrpcQueryKey(identity, opts);
  return useQuery({
    queryKey,
    queryFn: async () => {
      const client = new ClientImpl(
        new BinaryPrpcClient({ host, insecure, getAuthToken }),
      );
      // `method` is constrained to be a key that has an associated property of
      // type `PrpcMethod` in a `Service`. Therefore `service[method]` is
      // guaranteed to be a `PrpcMethod`. TSC isn't smart enough to know that,
      // so we need to use type casting.
      return await (
        client[method] as PrpcMethod<
          PrpcMethodRequest<Service[MK]>,
          PrpcMethodResponse<Service[MK]>
        >
      )(request);
    },
    ...options,
  });
}
