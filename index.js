var util = require('util'),
	child_process = require('child_process');

// Get access to the ChildProcess constructor
var ChildProcess = child_process.spawn('echo', ['> /dev/null']).constructor;

var Child = function() {
	ChildProcess.call(this);
};
util.inherits(Child, ChildProcess);

Child.prototype.spawn = function(file, args, options) {
	// Create the new process
	var c = new Child();
	// Pass error event through
	this.on('error', function(err) {
		c.emit('error', err);
	});
	// Spawn on close of previous
	this.on('close', function() {
		_spawn(c, file, args, options);
	});
	return c;
};

Child.prototype.exec = function() {

};

Child.prototype.execFile = function() {

};

function _spawn(child/*, file, args, options*/) {
	var opts = normalizeSpawnArguments.apply(null, Array.prototype.slice.call(arguments, 1));

	var file = opts.file;
	var args = opts.args;
	var options = opts.options;
	var envPairs = opts.envPairs;

	// Spawn the process
	ChildProcess.prototype.spawn.call(child, {
		file: file,
		args: args,
		cwd: options ? options.cwd : null,
		windowsVerbatimArguments: !!(options && options.windowsVerbatimArguments),
		detached: !!(options && options.detached),
		envPairs: envPairs,
		stdio: options ? options.stdio : null,
		uid: options ? options.uid : null,
		gid: options ? options.gid : null
	});

	return child;
}

function normalizeSpawnArguments(file/*, args, options*/) {
	var args, options;
	if (Array.isArray(arguments[1])) {
		args = arguments[1].slice(0);
		options = arguments[2];
	} else if (arguments[1] && !Array.isArray(arguments[1])) {
		throw new TypeError('Incorrect value of args option');
	} else {
		args = [];
		options = arguments[1];
	}

	args.unshift(file);

	var env = (options && options.env ? options.env : null) || process.env;
	var envPairs = [];
		for (var key in env) {
		envPairs.push(key + '=' + env[key]);
	}

	if (options && options.customFds && !options.stdio) {
		options.stdio = options.customFds.map(function(fd) {
			return fd === -1 ? 'pipe' : fd;
		});
	}

	return {
		file: file,
		args: args,
		options: options,
		envPairs: envPairs
	};
}

function decorate(child) {
	child.spawn = Child.prototype.spawn.bind(child);
	child.exec = Child.prototype.exec.bind(child);
	child.execFile = Child.prototype.execFile.bind(child);
}

module.exports = {
	_ChildProcess: ChildProcess,
	ChildProcess: Child,
	spawn: function(file, args, options) {
		var c = child_process.spawn.apply(null, arguments);
		decorate(c);
		return c;
	},
	exec: function() {},
	execFile: function() {
		var c = child_process.execFile.apply(null, arguments);
		decorate(c);
		return c;
	}
};
