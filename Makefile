.PHONY: test
test:
	./node_modules/test-agent/bin/js-test-agent test

.PHONY: test-server
test-server:
	./node_modules/test-agent/bin/js-test-agent server --growl
