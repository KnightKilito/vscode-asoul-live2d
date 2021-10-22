class Live2d {
	live2dWrapper = undefined; // live2d html最外层节点div

	constructor() {
		// 添加postmessage事件监听
		const receiveMessage = (event) => {
			const origin = event.origin || event.originalEvent.origin;
			if (origin !== "vscode-webview://webviewview-vscode-live2d-live2dview")
				return;
			const { type, data } = event.data;
			switch (type) {
				case 'auto-lodash-live2d-asoul':
					localStorage.setItem('asoul-live2d', 'true')
					break;
				case 'unauto-lodash-live2d-asoul':
					localStorage.setItem('asoul-live2d', 'false')
					break;
				case 'lodash-live2d-asoul':
					this.createLive2d();
					break;
				case 'close-live2d-asoul':
					this.deleteLive2d();
					break;
				default:
					break;
			}
		}
		window.addEventListener('message', receiveMessage, false);

		// 从localstorage中获取配置信息，进行对应处理
		if (localStorage.getItem('asoul-live2d') === 'true')
			this.createLive2d();
	}

	// 会进行校验，最多只允许创建一个
	createLive2d = () => {
		if (document.getElementById('live2d-wrapper'))
			return;
		if (this.live2dWrapper) {
			document.body.appendChild(this.live2dWrapper);
			return;
		}
		this.live2dWrapper = document.createElement('div');
		this.live2dWrapper.id = 'live2d-wrapper';
		// 显示iframe, live2d
		const iframe = this.initIframe();
		if (!iframe)
			return;
		this.live2dWrapper.appendChild(iframe);
		// 控制按钮
		const controlBar = this.initControlBar(this.live2dWrapper);
		controlBar && this.live2dWrapper.appendChild(controlBar);
		this.addWrapperStyle();
		document.body.appendChild(this.live2dWrapper);
	}

	// 只是将 live2dWrapper 整个节点从body移除，依旧存在内存中，因为还存在事件的引用
	deleteLive2d = () => {
		if (this.live2dWrapper) {
			this.live2dWrapper.remove();
			// this.live2dWrapper = undefined;
		}
	}

	// 外壳wrapper基础样式
	addWrapperStyle = () => {
		let styleNode = document.createElement('style');
		let styleContent = `
		div#live2d-wrapper {
			width: 280px;
			height: 300px;
			position: fixed;
			bottom: 50px;
			right: 50px;
			z-index: 100;
		}
		.live2d-wrapper-controller-wrapper {
			pointer-events:auto;
			position: absolute;
			right: 1px;
			top: 2px; 
			display:flex;
			opacity: 0;
			transition: all 0.2s;
		}
		.live2d-wrapper-controller-wrapper:hover {
			opacity: 1;
		}
		.live2d-wrapper-controller-icon {
			width:16px;
			height:16px;
			cursor: pointer;
			transition: all 0.3s;
		}
		.live2d-wrapper-controller-icon:hover {
			width:20px;
			height:20px;
		}
		.live2d-wrapper-controller-corner {
			width: 10px;
			height: 10px;
			background-color: #faa;
			position: absolute;
		}
		`;
		styleNode.appendChild(document.createTextNode(styleContent))
		document.head.appendChild(styleNode);
	}

	// iframe, 初始化具体live2d的页面
	initIframe = () => {
		const str = window.location.href;
		if (!str.includes('workbench.html'))
			return
		const iframe = document.createElement('iframe');
		iframe.style.cssText = 'width:100%; height:100%; border:0;';
		iframe.src = str.replace('workbench.html', 'live2d/index.html');
		return iframe;
	}

	// 控制图标，三个图标 调整大小，点击穿透，拖拽位置
	initControlBar = (container) => {
		const controlEles = document.createElement('div');
		controlEles.classList.add("live2d-wrapper-controller-wrapper");

		const borderIconDiv = document.createElement('div');
		borderIconDiv.title = '调整大小';
		const borderIcon = document.createElement('img');
		borderIcon.src = 'https://s3.bmp.ovh/imgs/2021/10/c87f9f3d038d2598.png';
		borderIcon.classList.add("live2d-wrapper-controller-icon");
		borderIcon.addEventListener('click', (() => {
			let hasBorder = false;
			let corners;
			return () => {
				hasBorder = !hasBorder;
				if (hasBorder)
					corners = this.addBorderCorner(container, corners);
				else
					corners.forEach(ele => ele.remove());
				// container.style.border = hasBorder ? 'solid 4px white' : '0';
			}
		})());
		borderIconDiv.appendChild(borderIcon);
		controlEles.appendChild(borderIconDiv);

		const penetrateIconDiv = document.createElement('div');
		penetrateIconDiv.title = '是否允许点击穿透';
		penetrateIconDiv.style.cssText = 'margin: 0 6px;';
		const penetrateIcon = document.createElement('img');
		penetrateIcon.src = 'https://s3.bmp.ovh/imgs/2021/10/aa5c35f26d1541b8.png';
		penetrateIcon.classList.add("live2d-wrapper-controller-icon");
		penetrateIcon.addEventListener('click', (() => {
			let isPenetrate = false;
			return () => {
				isPenetrate = !isPenetrate;
				container.style.pointerEvents = isPenetrate ? 'none' : 'auto';
			}
		})());
		penetrateIconDiv.appendChild(penetrateIcon);
		controlEles.appendChild(penetrateIconDiv);

		const dragIconDiv = document.createElement('div');
		dragIconDiv.title = '鼠标按住拖拽移动';
		const dragIcon = document.createElement('img');
		dragIcon.src = 'https://s3.bmp.ovh/imgs/2021/10/9e34525e8e70acd8.png';
		dragIcon.classList.add("live2d-wrapper-controller-icon");
		document.addEventListener("mousedown", e => {
			// 这里过滤掉非目标元素
			if (e.target !== dragIcon) {
				return;
			}
			const disx = e.pageX - container.offsetLeft;//获取鼠标相对元素距离
			const disy = e.pageY - container.offsetTop;
			const handleMove = (event) => {
				container.style.left = event.pageX - disx + 'px';
				container.style.top = event.pageY - disy + 'px';
			};
			const tempMouseUp = () => {
				document.removeEventListener("mousemove", handleMove);
				document.removeEventListener("mouseup", tempMouseUp);
			}
			document.addEventListener("mousemove", handleMove);
			document.addEventListener("mouseup", tempMouseUp);
			e.preventDefault();//阻止浏览器的默认事件
		});
		dragIconDiv.appendChild(dragIcon);
		controlEles.appendChild(dragIconDiv);

		return controlEles;
	}

	// 初始化4个角落点，用于后续拖拽缩放大小
	initCorner = () => {
		// 来4个元素
		const eles = Array.from({ length: 4 }).map(() =>
			document.createElement("div")
		);
		eles.forEach(x => x.classList.add("live2d-wrapper-controller-corner"));
		// 分别在topleft、topright、bottomleft、bottomright位置
		const [tl, tr, bl, br] = eles;

		// 每一个角都移动半个身位
		Object.assign(tl.style, {
			top: "-5px",
			left: "-5px",
			cursor: "nw-resize"
		});
		Object.assign(tr.style, {
			top: "-5px",
			cursor: "ne-resize",
			right: "-5px"
		});
		Object.assign(bl.style, {
			bottom: "-5px",
			cursor: "sw-resize",
			left: "-5px"
		});
		Object.assign(br.style, {
			bottom: "-5px",
			cursor: "se-resize",
			right: "-5px"
		});
		return { eles };
	}

	// 给4个角落点挂载事件
	drag = (ele, container, type) => {
		if (!type)
			return;
		document.addEventListener("mousedown", e => {
			console.log()
			// 这里过滤掉非目标元素
			if (e.target !== ele) {
				return;
			}

			const { width, height, top, bottom, left, right } = container.getBoundingClientRect();
			const disx = e.pageX;//获取鼠标相对元素距离
			const disy = e.pageY;
			const pageWidth = document.documentElement.clientWidth;
			const pageHeight = document.documentElement.clientHeight;

			let factorWidth = 1;
			let factorHeight = 1;
			// 固定container元素
			if (type === 'tl') {
				factorWidth = -1;
				factorHeight = -1;
				container.style.top = '';
				container.style.left = '';
				container.style.right = pageWidth - right + 'px';
				container.style.bottom = pageHeight - bottom + 'px';
			}
			else if (type === 'tr') {
				factorHeight = -1;
				container.style.top = '';
				container.style.left = left + 'px';
				container.style.right = '';
				container.style.bottom = pageHeight - bottom + 'px';
			}
			else if (type === 'bl') {
				factorWidth = -1;
				container.style.top = top + 'px';
				container.style.left = '';
				container.style.right = pageWidth - right + 'px';
				container.style.bottom = '';
			}
			else if (type === 'br') {
				container.style.top = top + 'px';
				container.style.left = left + 'px';
				container.style.right = '';
				container.style.bottom = '';
			}

			// 防止iframe上的鼠标移动事件丢失
			const iframe = container.getElementsByTagName('iframe')[0];
			iframe && (iframe.style.pointerEvents = 'none');

			const Live2dResize = (event) => {
				const newWidth = width + (event.pageX - disx) * factorWidth;
				const newHeight = height + (event.pageY - disy) * factorHeight;
				// 最小宽高
				if (newWidth >= 75)
					container.style.width = newWidth + 'px';
				if (newHeight >= 75)
					container.style.height = newHeight + 'px';
			};
			const tempMouseUp = () => {
				iframe && (iframe.style.pointerEvents = 'inherit');
				document.removeEventListener("mousemove", Live2dResize);
				document.removeEventListener("mouseup", tempMouseUp);
			}
			document.addEventListener("mousemove", Live2dResize);
			document.addEventListener("mouseup", tempMouseUp);
			e.preventDefault();//阻止浏览器的默认事件
		});
	}

	addBorderCorner = (target, corners) => {
		if (!target)
			return;
		// 获取四个角——eles
		if (!corners) {
			const { eles } = this.initCorner();
			const [tl, tr, bl, br] = eles;
			target.appendChild(tl);
			this.drag(tl, target, 'tl');
			target.appendChild(tr);
			this.drag(tr, target, 'tr');
			target.appendChild(bl);
			this.drag(bl, target, 'bl');
			target.appendChild(br);
			this.drag(br, target, 'br');
			return eles;
		}
		else {
			corners.forEach(ele => target.appendChild(ele));
			return corners;
		}
	}
}