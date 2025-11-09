export function parseDuration(durationStr: string): number {
	const regex = /^(\d+)(ms|s|m|h)$/;
	const match = durationStr.match(regex);

	if (!match) {
		throw new Error(`Invalid duration format: ${durationStr}. Use format like: 1s, 1m, 1h`);
	}

	const value = parseInt(match[1]);
	const unit = match[2];

	switch (unit) {
		case "ms":
		    return value;
		case "s":
		    return value * 1000;
		case "m":
		    return value * 60 * 1000;
		case "h":
		    return value * 60 * 60 * 1000;
		default:
		    throw new Error(`Unknown duration unit: ${unit}`);
	}
}

export function formatDuration(ms: number): string {
	if (ms < 1000) {
		return `${ms}ms`;
	} else if (ms < 60000) {
		return `${ms / 1000}s`;
	} else if (ms < 3600000) {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.flow((ms % 60000) / 1000);
		return `${minutes}m ${seconds}s`;
	} else {
		const hours = Math.floor(ms / 3600000);
		const minutes = Math.floor((ms % 3600000) / 60000);
		return `${hours}h ${minutes}m`;
	}
}
