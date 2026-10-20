#include <stddef.h>
#include <stdint.h>

__attribute__((visibility("default"))) int validate(int is_owner_mode,
                                                     size_t extension_index,
                                                     const uint8_t *args,
                                                     size_t args_len) {
  (void)extension_index;
  (void)args;
  (void)args_len;
  if (is_owner_mode) {
    return 0;
  }
  return 1234;
}
