import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { PreviewLink, PreviewObject, PreviewDefault } from 'Component';
import { I, S, U, Preview, Mark, translate, Action } from 'Lib';

const OFFSET_Y = 8;
const BORDER = 12;

interface State {
	object: any;
};

const PreviewIndex = observer(class PreviewIndex extends React.Component<{}, State> {

	ref = null;
	state = {
		object: null,
	};
	
	constructor (props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onUnlink = this.onUnlink.bind(this);
		this.position = this.position.bind(this);
		this.setObject = this.setObject.bind(this);
	};
	
	render () {
		const { preview } = S.Common;
		const { type, target, object, noUnlink, noEdit } = preview;
		const cn = [ 'previewWrapper' ];

		const unlink = <div id="button-unlink" className="item" onClick={this.onUnlink}>{translate('commonUnlink')}</div>;

		let head = null;
		let content = null;

		switch (type) {
			case I.PreviewType.Link: {
				head = (
					<div className="head">
						<div id="button-copy" className="item" onClick={this.onCopy}>{translate('commonCopyLink')}</div>
						{!noEdit ? <div id="button-edit" className="item" onClick={this.onEdit}>{translate('previewEdit')}</div> : ''}
						{!noUnlink ? unlink : ''}
					</div>
				);

				content = <PreviewLink ref={ref => this.ref = ref} url={target} position={this.position} />;
				break;
			};

			case I.PreviewType.Object: {
				if (!noUnlink) {
					head = (
						<div className="head">
							{unlink}
						</div>
					);
				};

				content = <PreviewObject ref={ref => this.ref = ref} size={I.PreviewSize.Small} rootId={target} setObject={this.setObject} position={this.position} />;
				break;
			};

			case I.PreviewType.Default: {
				if (!noUnlink) {
					head = (
						<div className="head">
							{unlink}
						</div>
					);
				};

				content = <PreviewDefault ref={ref => this.ref = ref} rootId={target} object={object} setObject={this.setObject} position={this.position} />;
				break;
			};
		};

		if (head) {
			cn.push('withHead');
		};

		return (
			<div id="preview" className={cn.join(' ')}>
				<div className="polygon" onClick={this.onClick} />
				<div className="content">
					{head}

					<div onClick={this.onClick}>
						{content}
					</div>
				</div>
			</div>
		);
	};

	onClick (e: React.MouseEvent) {
		if (e.button) {
			return;
		};

		const { preview } = S.Common;
		const { type, target } = preview;
		const object = preview.object || this.state.object;

		switch (type) {
			case I.PreviewType.Link: {
				Action.openUrl(target);	
				break;
			};

			case I.PreviewType.Default:
			case I.PreviewType.Object: {
				U.Object.openEvent(e, object);
				break;
			};
		};
	};
	
	onCopy () {
		const { preview } = S.Common;
		const { target } = preview;
		
		U.Common.clipboardCopy({ text: target });
		Preview.previewHide(true);
	};
	
	onEdit (e) {
		e.preventDefault();
		e.stopPropagation();

		const { preview } = S.Common;
		const { marks, range, onChange } = preview;
		const mark = Mark.getInRange(marks, I.MarkType.Link, range);
		const win = $(window);
		const rect = U.Common.objectCopy($('#preview').get(0).getBoundingClientRect());

		S.Menu.open('blockLink', {
			rect: rect ? { ...rect, height: 0, y: rect.y + win.scrollTop() } : null, 
			horizontal: I.MenuDirection.Center,
			onOpen: () => Preview.previewHide(true),
			data: {
				filter: mark ? mark.param : '',
				type: mark ? mark.type : null,
				onChange: (type: I.MarkType, param: string) => {
					onChange(Mark.toggleLink({ type, param, range }, marks));
				}
			}
		});
	};
	
	onUnlink () {
		const { preview } = S.Common;
		const { range, onChange } = preview;

		onChange(Mark.toggleLink({ type: this.getMarkType(), param: '', range }, preview.marks));
		Preview.previewHide(true);
	};

	getMarkType () {
		const { preview } = S.Common;
		const { type } = preview;

		switch (type) {
			case I.PreviewType.Link: {
				return I.MarkType.Link;
			};

			case I.PreviewType.Default:
			case I.PreviewType.Object: {
				return I.MarkType.Object;
			};
		};
	};

	setObject (object) {
		this.setState({ object });
	};

	position () {
		const { preview } = S.Common;
		const { x, y, width, height } = preview;
		const win = $(window);
		const obj = $('#preview');
		const poly = obj.find('.polygon');
		const { ww, wh } = U.Common.getWindowDimensions();
		const st = win.scrollTop();
		const ow = obj.outerWidth();
		const oh = obj.outerHeight();
		const css: any = { opacity: 0, left: 0, top: 0 };
		const pcss: any = { top: 'auto', bottom: 'auto', width: '', left: '', height: height + OFFSET_Y, clipPath: '' };

		let typeY = I.MenuDirection.Bottom;		
		let ps = (1 - width / ow) / 2 * 100;
		let pe = ps + width / ow * 100;
		let cpTop = 'polygon(0% 0%, ' + ps + '% 100%, ' + pe + '% 100%, 100% 0%)';
		let cpBot = 'polygon(0% 100%, ' + ps + '% 0%, ' + pe + '% 0%, 100% 100%)';
		
		if (ow < width) {
			pcss.width = width;
			pcss.left = (ow - width) / 2;
			ps = (width - ow) / width / 2 * 100;
			pe = (1 - (width - ow) / width / 2) * 100;
			
			cpTop = 'polygon(0% 100%, ' + ps + '% 0%, ' + pe + '% 0%, 100% 100%)';
			cpBot = 'polygon(0% 0%, ' + ps + '% 100%, ' + pe + '% 100%, 100% 0%)';
		};

		if (y + oh + height >= st + wh) {
			typeY = I.MenuDirection.Top;
		};
		
		if (typeY == I.MenuDirection.Top) {
			css.top = y - oh - OFFSET_Y;
			css.transform = 'translateY(-5%)';
				
			pcss.bottom = -height - OFFSET_Y;
			pcss.clipPath = cpTop;
		};
			
		if (typeY == I.MenuDirection.Bottom) {
			css.top = y + height + OFFSET_Y;
			css.transform = 'translateY(5%)';
				
			pcss.top = -height - OFFSET_Y;
			pcss.clipPath = cpBot;
		};
			
		css.left = x - ow / 2 + width / 2;
		css.left = Math.max(BORDER, css.left);
		css.left = Math.min(ww - ow - BORDER, css.left);

		obj.show().css(css);

		if (!preview.noAnimation) {
			obj.addClass('anim');
		};

		poly.css(pcss);
		window.setTimeout(() => { obj.css({ opacity: 1, transform: 'translateY(0%)' }); }, 15);
	};

});

export default PreviewIndex;