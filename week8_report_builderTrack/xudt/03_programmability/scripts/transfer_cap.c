#include <stddef.h>
#include <stdint.h>

#include "ckb_consts.h"
#include "ckb_raw_syscalls.h"

#define ERROR_ARGS -100
#define ERROR_SYSCALL -101
#define ERROR_DATA -102
#define ERROR_OVERFLOW -103
#define ERROR_CAP_EXCEEDED -104

#define LOCK_HASH_SIZE 32
#define AMOUNT_SIZE 16
#define MAX_CELL_DATA 272

static int bytes_equal(const uint8_t *a, const uint8_t *b, size_t n) {
  for (size_t i = 0; i < n; i++) {
    if (a[i] != b[i]) {
      return 0;
    }
  }
  return 1;
}

static unsigned __int128 read_u128_le(const uint8_t *b) {
  unsigned __int128 v = 0;
  for (int i = 15; i >= 0; i--) {
    v = (v << 8) | (unsigned __int128)b[i];
  }
  return v;
}

/*
 * xUDT extension entry point.
 *
 * Rule: for a non-owner transaction, the sum of token amounts in group outputs
 * whose lock hash differs from the first group input's lock hash must not
 * exceed the cap encoded in `args` (u128 little-endian).
 *
 * Owner mode is always allowed so minting and recovery remain possible.
 * The first group input is treated as the sender; this is a demo-scope
 * assumption and is documented in the module report.
 */
__attribute__((visibility("default"))) int validate(int is_owner_mode,
                                                     size_t extension_index,
                                                     const uint8_t *args,
                                                     size_t args_len) {
  (void)extension_index;

  if (is_owner_mode) {
    return 0;
  }
  if (args == 0 || args_len != AMOUNT_SIZE) {
    return ERROR_ARGS;
  }

  const unsigned __int128 cap = read_u128_le(args);

  uint8_t sender[LOCK_HASH_SIZE];
  uint64_t len = LOCK_HASH_SIZE;
  int ret = ckb_load_cell_by_field(sender, &len, 0, 0, CKB_SOURCE_GROUP_INPUT,
                                   CKB_CELL_FIELD_LOCK_HASH);
  if (ret != CKB_SUCCESS || len != LOCK_HASH_SIZE) {
    return ERROR_SYSCALL;
  }

  unsigned __int128 sent = 0;
  for (size_t i = 0;; i++) {
    uint8_t lock_hash[LOCK_HASH_SIZE];
    len = LOCK_HASH_SIZE;
    ret = ckb_load_cell_by_field(lock_hash, &len, 0, i, CKB_SOURCE_GROUP_OUTPUT,
                                 CKB_CELL_FIELD_LOCK_HASH);
    if (ret == CKB_INDEX_OUT_OF_BOUND) {
      break;
    }
    if (ret != CKB_SUCCESS || len != LOCK_HASH_SIZE) {
      return ERROR_SYSCALL;
    }
    if (bytes_equal(lock_hash, sender, LOCK_HASH_SIZE)) {
      continue;
    }

    uint8_t data[MAX_CELL_DATA];
    len = MAX_CELL_DATA;
    ret = ckb_load_cell_data(data, &len, 0, i, CKB_SOURCE_GROUP_OUTPUT);
    if (ret != CKB_SUCCESS || len < AMOUNT_SIZE) {
      return ERROR_DATA;
    }

    const unsigned __int128 amount = read_u128_le(data);
    if (sent + amount < sent) {
      return ERROR_OVERFLOW;
    }
    sent += amount;
    if (sent > cap) {
      return ERROR_CAP_EXCEEDED;
    }
  }

  return 0;
}
