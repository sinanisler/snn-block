/**
 * SNN Static Deploy: settings page controls.
 *
 * Start, pause, resume and cancel call the REST API. While an export runs, the page calls
 * the step endpoint one after another; each call does a short batch of work on the server.
 * When the page is closed, WP-Cron continues the export (see static-deploy.php).
 */
(function () {
	'use strict';

	var cfg = window.snnStaticDeploy;
	if (!cfg || !cfg.rest) {
		return;
	}

	var el = {
		start: document.getElementById('snn-sd-start'),
		pause: document.getElementById('snn-sd-pause'),
		resume: document.getElementById('snn-sd-resume'),
		cancel: document.getElementById('snn-sd-cancel'),
		download: document.getElementById('snn-sd-download'),
		bar: document.getElementById('snn-sd-bar'),
		progress: document.querySelector('.snn-sd-progress'),
		status: document.getElementById('snn-sd-status'),
		counts: document.getElementById('snn-sd-counts'),
		log: document.getElementById('snn-sd-log')
	};

	// Translated labels come from the server (see snn_static_deploy_enqueue()).
	var labels = cfg.labels || { states: {}, stages: {} };

	var running = false;
	var failures = 0;

	function request(path, method) {
		return window.fetch(cfg.rest + path, {
			method: method || 'GET',
			credentials: 'same-origin',
			headers: { 'X-WP-Nonce': cfg.nonce, 'Content-Type': 'application/json' }
		}).then(function (response) {
			return response.json().then(function (data) {
				if (!response.ok) {
					var error = new Error((data && data.message) || response.statusText);
					error.status = response.status;
					throw error;
				}
				return data;
			});
		});
	}

	function statusLine(s) {
		var text = labels.states[s.status] || s.status;
		if (s.status === 'idle') {
			return text;
		}
		if (labels.stages[s.stage]) {
			text += ' - ' + labels.stages[s.stage];
		}
		if (s.error) {
			text += ' - ' + s.error;
		}
		return text;
	}

	function setVisible(node, visible) {
		if (node) {
			node.hidden = !visible;
		}
	}

	function render(s) {
		if (!s) {
			return;
		}
		var percent = Math.max(0, Math.min(100, parseInt(s.percent, 10) || 0));
		if (el.bar) {
			el.bar.style.width = percent + '%';
		}
		if (el.progress) {
			el.progress.setAttribute('aria-valuenow', String(percent));
		}
		if (el.status) {
			el.status.textContent = statusLine(s);
		}

		if (el.counts && s.pages) {
			var nodes = el.counts.querySelectorAll('[data-key]');
			for (var i = 0; i < nodes.length; i++) {
				var key = nodes[i].getAttribute('data-key');
				nodes[i].textContent = String(s.pages[key] || 0);
			}
		}

		var active = s.status === 'running' || s.status === 'paused';
		setVisible(el.start, !active);
		setVisible(el.pause, s.status === 'running');
		setVisible(el.resume, s.status === 'paused');
		setVisible(el.cancel, active);
		setVisible(el.download, !!s.zip_ready && !!s.job_id);
		if (el.download && s.zip_ready && s.job_id) {
			el.download.href = cfg.downloadUrl + '?action=snn_static_deploy_download&job=' + encodeURIComponent(s.job_id) + '&_wpnonce=' + encodeURIComponent(cfg.downloadNonce);
		}

		renderLog(s.messages || []);
	}

	function renderLog(messages) {
		if (!el.log) {
			return;
		}
		var fragment = document.createDocumentFragment();
		for (var i = messages.length - 1; i >= 0; i--) {
			var m = messages[i];
			var li = document.createElement('li');
			li.className = 'snn-sd-log-' + (m.type || 'info');
			var time = document.createElement('time');
			time.textContent = m.t || '';
			var text = document.createElement('span');
			text.className = 'snn-sd-log-text';
			text.textContent = m.text || '';
			li.appendChild(time);
			li.appendChild(text);
			if (m.url) {
				var code = document.createElement('code');
				code.className = 'snn-sd-log-url';
				code.textContent = m.url;
				li.appendChild(code);
			}
			fragment.appendChild(li);
		}
		el.log.textContent = '';
		el.log.appendChild(fragment);
	}

	function loop() {
		if (!running) {
			return;
		}
		request('step', 'POST').then(function (s) {
			failures = 0;
			render(s);
			if (s.status === 'running') {
				window.setTimeout(loop, 250);
			} else {
				running = false;
			}
		}).catch(function () {
			failures++;
			if (failures >= 3) {
				running = false;
				if (el.status) {
					el.status.textContent = cfg.i18n.stepFailed;
				}
				return;
			}
			window.setTimeout(loop, 2000);
		});
	}

	function begin() {
		running = true;
		failures = 0;
		loop();
	}

	if (el.start) {
		el.start.addEventListener('click', function () {
			if (el.status) {
				el.status.textContent = cfg.i18n.starting;
			}
			request('start', 'POST').then(function (s) {
				render(s);
				begin();
			}).catch(function (error) {
				if (el.status) {
					el.status.textContent = error.message;
				}
			});
		});
	}

	if (el.pause) {
		el.pause.addEventListener('click', function () {
			running = false;
			request('pause', 'POST').then(render).catch(function (error) {
				if (el.status) {
					el.status.textContent = error.message;
				}
			});
		});
	}

	if (el.resume) {
		el.resume.addEventListener('click', function () {
			request('resume', 'POST').then(function (s) {
				render(s);
				begin();
			}).catch(function (error) {
				if (el.status) {
					el.status.textContent = error.message;
				}
			});
		});
	}

	if (el.cancel) {
		el.cancel.addEventListener('click', function () {
			if (!window.confirm(cfg.i18n.confirmCancel)) {
				return;
			}
			running = false;
			request('cancel', 'POST').then(render).catch(function (error) {
				if (el.status) {
					el.status.textContent = error.message;
				}
			});
		});
	}

	// Opened while an export is running (or paused): carry on from where it is.
	if (cfg.status && cfg.status.status === 'running') {
		begin();
	}
})();
