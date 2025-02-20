import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { S, sidebar, translate, U } from 'Lib';
import { Icon, IconObject, ObjectName } from 'Component';

interface Props extends React.Component {
	page: string;
};

const SidebarSettings = observer(class SidebarSettings extends React.Component<Props, {}> {

	node: any = null;
	routeBack: any = null;

	render () {
		const space = U.Space.getSpaceview();
		const { membership } = S.Auth;
		const { membershipTiersList } = S.Common;
		const sections = this.getSections();
		const profile = U.Space.getProfile();
		const participant = U.Space.getParticipant() || profile;
		const pathname = U.Router.getRoute();
		const param = U.Router.getParam(pathname);
		const isSpace = this.props.page == 'settingsSpace';

		const onBack = () => {
			if (!this.routeBack || !this.routeBack.pathname) {
				U.Space.openDashboard('route');
				return;
			};

			U.Router.go(this.routeBack.pathname, {});
		};

		const Item = (action: any) => {
			const cn = [ 'item' ];

			let icon = null;
			let name = null;
			let caption = null;

			if (action.id == param.id || (action.subPages && action.subPages.includes(param.id))) {
				cn.push('active');
			};

			if (action.id == 'account') {
				if ('index' == param.id) {
					cn.push('active');
				};

				if (participant) {
					name = participant?.globalName || participant?.name;
					icon = <IconObject object={{ ...participant, name }} size={36} iconSize={36} />;
				};

				cn.push('itemAccount');
			} else {
				icon = <Icon className={`settings-${action.icon || action.id}`} />;
				name = action.name;
			};

			if (action.id == 'membership') {
				if (!membership.isNone) {
					const tierItem = U.Data.getMembershipTier(membership.tier);
					caption = <div className="caption">{tierItem.name}</div>;
				} else {
					caption = <div className="caption join">{translate(`commonJoin`)}</div>;
				};
			};

			if (action.isToggle) {
				cn.push('isToggle');
			};

			return (
				<div
					id={`item-${action.id}`}
					className={cn.join(' ')}
					onClick={() => this.onClick(action)}
				>
					{icon}
					<div className="name">{name}</div>

					{caption}
				</div>
			);
		};

		const Section = (item: any) => {
			const cn = [ 'section', String(item.id || ''), item.isLabel ? 'isLabel' : '' ];

			let name = null;
			if (item.isToggle) {
				name = (
					<div className="toggle" onClick={() => this.onToggle(item)}>
						<Icon />
						{item.name}
					</div>
				);
			} else
			if (item.name) {
				name = <div className="name">{item.name}</div>;
			};

			return (
				<div id={`settings-section-${item.id}`} className={cn.join(' ')}>
					{name}

					{item.children ? (
						<div className="items">
							{item.children.map((action: any, i: number) => (
								<Item key={i} {...action} />
							))}
						</div>
					) : ''}
				</div>
			);
		};

		return (
			<div ref={ref => this.node = ref} id="containerSettings" className={isSpace ? 'spaceSettings' : 'appSettings'}>
				<div className="head" />

				<div className="body">
					<div className="list">
						{isSpace ? (
							<div className="head" onClick={onBack}>
								<Icon className="back" />
								<ObjectName object={space} />
							</div>
						) : ''}
						<div className="inner">
							{sections.map((item: any, i: number) => (
								<Section key={i} {...item} />
							))}
						</div>
					</div>

					{!isSpace ? (
						<div className="logout" onClick={() => S.Popup.open('logout', {})}>
							<Icon />
							{translate('commonLogout')}
						</div>
					) : ''}
				</div>
			</div>
		);
	};

	componentDidMount () {
		const history = U.Router.history;

		console.log('ITEMS: ', this.getItems())

		this.routeBack = history.entries[history.index - 1];
	};

	getSections () {
		const canWrite = U.Space.canMyParticipantWrite();
		const isSpace = this.props.page == 'settingsSpace';
		const settingsVault = [
			{ id: 'spaceList', name: translate('popupSettingsSpacesListTitle'), icon: 'spaces' },
			{ id: 'dataIndex', name: translate('popupSettingsDataManagementTitle'), icon: 'storage', subPages: [ 'dataPublish', 'delete' ] },
			{ id: 'phrase', name: translate('popupSettingsPhraseTitle') },
		];

		if (this.withMembership()) {
			settingsVault.push({ id: 'membership', icon: 'membership', name: translate('popupSettingsMembershipTitle1') });
		};

		const appSettings = [
			{ id: 'account', children: [ { id: 'account', name: translate('popupSettingsProfileTitle') } ] },
			{
				id: 'basicSettings', name: translate('popupSettingsApplicationTitle'), children: [
					{ id: 'personal', name: translate('popupSettingsPersonalTitle') },
					{ id: 'language', name: translate('pageSettingsLanguageTitle') },
					{ id: 'pinIndex', name: translate('popupSettingsPinTitle'), icon: 'pin', subPages: [ 'pinSelect', 'pinConfirm' ] },
				]
			},
			{ id: 'vaultSettings', name: translate('popupSettingsAccountAndKeyTitle'), children: settingsVault }
		];

		const importExport = [{
			id: 'exportIndex', icon: 'export', name: translate('commonExport'),
			subPages: [ 'exportProtobuf', 'exportMarkdown' ]
		}];

		if (canWrite) {
			importExport.unshift({
				id: 'importIndex', icon: 'import', name: translate('commonImport'),
				subPages: [ 'importNotion', 'importNotionHelp', 'importNotionWarning', 'importCsv' ]
			});
		};

		const spaceSettings = [
			{ id: 'common', name: translate('commonPreferences'), children: [
					{ id: 'spaceIndex', icon: 'space', name: translate('pageSettingsSpaceGeneral') },
					{ id: 'spaceShare', icon: 'members', name: translate('commonMembers') },
					{ id: 'spaceStorageManager', icon: 'storage', name: translate('pageSettingsSpaceRemoteStorage') },
				]
			},
			{ id: 'integrations', name: translate('pageSettingsSpaceIntegrations'), children: importExport },

			{ id: 'contentModel', name: translate('pageSettingsSpaceManageContent'), isLabel: true },
			{ id: 'contentModelTypes', isToggle: true, name: U.Common.plural(10, translate('pluralObjectType')), children: [] },
			{ id: 'contentModelFields', isToggle: true, name: U.Common.plural(10, translate('pluralField')), children: [] },
		];

		return isSpace ? spaceSettings : appSettings;
	};

	getItems () {
		const sections = this.getSections();

		let items: any[] = [];
		for (const section of sections) {
			if (section.name) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};
		return items;
	};

	withMembership () {
		return S.Common.isOnline && U.Data.isAnytypeNetwork();
	};

	onClick (item) {
		if (item.isToggle) {
			return;
		};

		this.onPage(item.id);
	};

	onPage (page) {
		sidebar.settingsOpen(page);
	};

	onToggle (item) {
		const obj = $(this.node).find(`#settings-section-${item.id}`);

		if (obj.hasClass('isOpen')) {
			obj.removeClass('isOpen');
		} else {
			obj.addClass('isOpen');
		};
	};

});

export default SidebarSettings
