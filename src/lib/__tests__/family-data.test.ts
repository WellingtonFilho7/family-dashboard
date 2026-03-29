import { describe, expect, it } from 'vitest';

import { getOptionalRelationError } from '../api/family-data';

describe('family-data optional relations', () => {
  it('ignores postgres missing relation errors for optional tables', () => {
    expect(
      getOptionalRelationError('supply_item_state', {
        code: '42P01',
        message: 'relation "supply_item_state" does not exist',
      }),
    ).toBeNull();
  });

  it('ignores postgrest schema cache misses for optional tables', () => {
    expect(
      getOptionalRelationError('supply_item_state', {
        code: 'PGRST205',
        message: "Could not find the table 'supply_item_state' in the schema cache",
        status: 404,
      }),
    ).toBeNull();
  });

  it('preserves unrelated errors', () => {
    const error = {
      code: '42501',
      message: 'permission denied for table supply_item_state',
      status: 403,
    };

    expect(getOptionalRelationError('supply_item_state', error)).toEqual(error);
  });
});
