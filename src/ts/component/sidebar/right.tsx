import * as React from 'react';
import { observer } from 'mobx-react';
import { U, S, keyboard } from 'Lib';

import PageType from './page/type';
import PageObjectRelation from './page/object/relation';

interface State {
	page: string;
	rootId: string;
};

const Components = {
	'type': PageType,
	'object/relation': PageObjectRelation,
};

const SidebarRight = observer(class SidebarRight extends React.Component<{}, State> {
	
	node = null;
	refChild = null;
	state = {
		page: '',
		rootId: '',
	};

    render() {
		const { showSidebarRight } = S.Common;
		const { page, rootId } = this.state;

		if (!showSidebarRight) {
			return null;
		};

		const Component = Components[page];
		const cn = [ 'sidebarPage', U.Common.toCamelCase(`page-${page.replace(/\//g, '-')}`) ];
		const isPopup = keyboard.isPopup();

        return (
			<div 
				ref={node => this.node = node}
				id="sidebarRight"
				className={[ 'sidebar', 'right', page == 'type' ? 'withPreview' : '' ].join(' ')}
			>
				{Component ? (
					<div className={cn.join(' ')}>
						<Component 
							ref={ref => this.refChild = ref} 
							{...this.props} 
							rootId={rootId}
							isPopup={isPopup}
						/> 
					</div>
				): ''}
			</div>
		);
    };

});

export default SidebarRight;
