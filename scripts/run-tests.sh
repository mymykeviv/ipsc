#!/bin/bash

# Simple wrapper for the unified test runner
# This maintains backward compatibility while using the new consolidated approach

# Forward all arguments to the unified test runner
exec "$(dirname "$0")/test-runner.sh" "$@"
