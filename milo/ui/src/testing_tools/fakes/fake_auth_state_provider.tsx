import { useMemo } from 'react';
import { useLatest } from 'react-use';

import { AuthState } from '@/common/api/auth_state';
import { AuthStateContext } from '@/common/components/auth_state_provider';
import { createMockAuthState } from '@/testing_tools/mocks/authstate_mock';

interface props {
  value?: AuthState;
  children: React.ReactElement;
}

export const FakeAuthStateProvider = ({ value, children }: props) => {
  if (!value) {
    value = createMockAuthState();
  }
  const valueRef = useLatest(value);
  const ctxValue = useMemo(
    () => ({
      getAuthState: () => valueRef.current,
      // This doesn't ensure the auth state is valid. But it should be good
      // enough for most unit tests that is not testing <AuthStateProvider />
      // itself.
      getValidAuthState: async () => valueRef.current,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value.identity],
  );

  return (
    <AuthStateContext.Provider value={ctxValue}>
      {children}
    </AuthStateContext.Provider>
  );
};
