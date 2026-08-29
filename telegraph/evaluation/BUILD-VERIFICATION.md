# Verified build properties

Built with a freestanding `wasm32` target and no WASI/runtime imports. The artifact exports the Telegraph scoring entry points and keeps scoring state in linear memory only.

The implementation deliberately avoids network access, time, randomness, and external files so validators can independently reproduce the same Local Score.
