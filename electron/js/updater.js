const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

const ConfigManager = require('./config.js');
const Util = require('./util.js');

const TIMEOUT_UPDATE = 600 * 1000;

class UpdateManager {

	isUpdating = false;
	autoUpdate = false;
	timeout = 0;
	exit = () => {};

	init (win) {
		const { channel } = ConfigManager.config;

		console.log('Channel: ', channel);

		autoUpdater.logger = log;
		autoUpdater.logger.transports.file.level = 'debug';
		autoUpdater.autoDownload = false;
		autoUpdater.autoInstallOnAppQuit = false;
		autoUpdater.channel = channel;

		this.setTimeout();

		autoUpdater.on('checking-for-update', () => {
			Util.log('info', 'Checking for update');
			Util.send(win, 'checking-for-update', this.autoUpdate);
		});

		autoUpdater.on('update-available', (info) => {
			this.isUpdating = true;
			this.clearTimeout();

			Util.log('info', 'Update available: ' + JSON.stringify(info, null, 3));
			Util.send(win, 'update-available', this.autoUpdate);

			if (this.autoUpdate) {
				this.download();
			};
		});

		autoUpdater.on('update-not-available', (info) => {
			this.isUpdating = false;

			Util.log('info', 'Update not available: ' +  JSON.stringify(info, null, 3));
			Util.send(win, 'update-not-available', this.autoUpdate);
		});
		
		autoUpdater.on('error', (err) => { 
			this.isUpdating = false;

			Util.log('Error: ' + err);
			Util.send(win, 'update-error', err, this.autoUpdate);
		});
		
		autoUpdater.on('download-progress', (progress) => {
			this.isUpdating = true;

			let msg = [
				`Download speed: ${progress.bytesPerSecond}`,
				'-',
				`Downloaded: ${progress.percent}%`,
				`(${progress.transferred}/${progress.total})`
			];

			Util.log('info', msg.join(' '));
			Util.send(win, 'download-progress', progress);
		});

		autoUpdater.on('update-downloaded', (info) => {
			this.isUpdating = false;

			Util.log('info', 'Update downloaded: ' +  JSON.stringify(info, null, 3));
			Util.send(win, 'update-downloaded');

			if (!this.autoUpdate) {
				this.exit(true);
			} else {
				Util.send(win, 'update-confirm');
			};
		});
	};

	setChannel (channel) {
		autoUpdater.channel = channel;
		checkUpdate(false);
	};

	checkUpdate (auto) {
		Util.log('info', 'isUpdating: ' + this.isUpdating);

		if (this.isUpdating) {
			return;
		};

		autoUpdater.checkForUpdatesAndNotify().catch((err) => {
			Util.log('info', `checkForUpdatesAndNotify error: ${err}`);
		});

		this.setTimeout();
		this.autoUpdate = auto;
	};

	download () {
		autoUpdater.downloadUpdate();
	};

	relaunch () {
		autoUpdater.quitAndInstall();
	};

	cancel () {
		this.isUpdating = false;
		this.clearTimeout();
	};

	setTimeout () {
		this.clearTimeout();
		this.timeout = setTimeout(() => { this.checkUpdate(true); }, TIMEOUT_UPDATE);
	};

	clearTimeout () {
		clearTimeout(this.timeout);
	};

};

module.exports = new UpdateManager();