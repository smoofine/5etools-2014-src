"use strict";

class PageFilterClassesBase extends PageFilterBase {
	constructor () {
		super();

		this._miscFilter = new Filter({
			header: "Miscellaneous",
			items: ["Reprinted", "Sidekick", "Legacy"],
			deselFn: (it) => { return it === "Reprinted" || it === "Sidekick"; },
			displayFnMini: it => it === "Reprinted" ? "Repr." : it,
			displayFnTitle: it => it === "Reprinted" ? it : "",
			isMiscFilter: true,
		});

		this._optionsFilter = new OptionsFilter({
			header: "Other/Text Options",
			defaultState: {
				isDisplayClassIfSubclassActive: false,
				isClassFeatureVariant: true,
			},
			displayFn: k => {
				switch (k) {
					case "isClassFeatureVariant": return "Class Feature Options/Variants";
					case "isDisplayClassIfSubclassActive": return "Display Class if Any Subclass is Visible";
					default: throw new Error(`Unhandled key "${k}"`);
				}
			},
			displayFnMini: k => {
				switch (k) {
					case "isClassFeatureVariant": return "C.F.O/V.";
					case "isDisplayClassIfSubclassActive": return "Sc>C";
					default: throw new Error(`Unhandled key "${k}"`);
				}
			},
		});
	}

	get optionsFilter () { return this._optionsFilter; }

	static mutateForFilters (cls) {
		cls.source = cls.source || Parser.SRC_PHB;
		cls.subclasses = cls.subclasses || [];

		cls.subclasses.forEach(sc => {
			sc.source = sc.source || cls.source; // default subclasses to same source as parent
			sc.shortName = sc.shortName || sc.name; // ensure shortName

			this._mutateForFilters_commonMisc(sc);
			this._mutateForFilters_commonSources(sc);
		});

		this._mutateForFilters_commonMisc(cls);
		this._mutateForFilters_commonSources(cls);

		cls._fSourceSubclass = [
			...new Set([
				cls.source,
				...cls.subclasses.map(it => it._fSources).flat(),
			]),
		];

		if (cls.isSidekick) cls._fMisc.push("Sidekick");
	}

	_addEntrySourcesToFilter (entry) { this._addEntrySourcesToFilter_walk(entry); }

	_addEntrySourcesToFilter_walk = (obj) => {
		if ((typeof obj !== "object") || obj == null) return;

		if (obj instanceof Array) return obj.forEach(this._addEntrySourcesToFilter_walk.bind(this));

		if (obj.source) this._sourceFilter.addItem(obj.source);
		// Assume anything we care about is under `entries`, for performance
		if (obj.entries) this._addEntrySourcesToFilter_walk(obj.entries);
	};

	/**
	 * @param cls
	 * @param isExcluded
	 * @param opts Options object.
	 * @param [opts.subclassExclusions] Map of `source:name:bool` indicating if each subclass is excluded or not.
	 */
	addToFilters (cls, isExcluded, opts) {
		if (isExcluded) return;
		opts = opts || {};
		const subclassExclusions = opts.subclassExclusions || {};

		// region Sources
		// Note that we assume that, for fluff from a given source, a class/subclass will exist from that source.
		//   This allows us to skip loading the class/subclass fluff in order to track the fluff's sources.
		this._sourceFilter.addItem(cls._fSources);
		this._miscFilter.addItem(cls._fMisc);

		if (cls.classFeatures) cls.classFeatures.forEach(feature => this._addEntrySourcesToFilter(feature));

		cls.subclasses.forEach(sc => {
			const isScExcluded = (subclassExclusions[sc.source] || {})[sc.name] || false;
			if (!isScExcluded) {
				this._sourceFilter.addItem(sc._fSources);
				this._miscFilter.addItem(sc._fMisc);
				if (sc.subclassFeatures) sc.subclassFeatures.forEach(feature => this._addEntrySourcesToFilter(feature));
			}
		});
		// endregion
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._miscFilter,
			this._optionsFilter,
		];
		opts.isCompact = true;
	}

	isClassNaturallyDisplayed (values, cls) {
		return this._filterBox.toDisplay(
			values,
			...this.constructor._getIsClassNaturallyDisplayedToDisplayParams(cls),
		);
	}

	static _getIsClassNaturallyDisplayedToDisplayParams (cls) { return [cls._fSources, cls._fMisc]; }

	isAnySubclassDisplayed (f, cls) {
		if (!f[this._optionsFilter.header].isDisplayClassIfSubclassActive) return false;
		return (cls.subclasses || [])
			.some(sc => this.isSubclassVisible(f, cls, sc));
	}

	isSubclassVisible (f, cls, sc) {
		return this._filterBox.toDisplayByFilters(
			f,
			{
				filter: this._sourceFilter,
				value: sc._fSources,
			},
			{
				filter: this._miscFilter,
				value: sc._fMisc,
			},
		);
	}

	/** Return the first active source we find; use this as a fake source for things we want to force-display. */
	getActiveSource (values) {
		const sourceFilterValues = values[this._sourceFilter.header];
		if (!sourceFilterValues) return null;
		return Object.keys(sourceFilterValues).find(it => this._sourceFilter.toDisplay(values, it));
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			...this._getToDisplayParams(values, it),
		);
	}

	_getToDisplayParams (values, cls) {
		return [
			this.isAnySubclassDisplayed(values, cls)
				? cls._fSourceSubclass
				: cls._fSources,
			cls._fMisc,
			null,
		];
	}
}

globalThis.PageFilterClassesBase = PageFilterClassesBase;

class PageFilterClasses extends PageFilterClassesBase {
	static _getClassSubclassLevelArray (it) {
		return it.classFeatures.map((_, i) => i + 1);
	}

	constructor () {
		super();

		this._levelFilter = new RangeFilter({
			header: "Feature Level",
			min: 1,
			max: 20,
		});
	}

	get levelFilter () { return this._levelFilter; }

	static mutateForFilters (cls) {
		super.mutateForFilters(cls);

		cls._fLevelRange = this._getClassSubclassLevelArray(cls);
	}

	/**
	 * @param cls
	 * @param isExcluded
	 * @param opts Options object.
	 * @param [opts.subclassExclusions] Map of `source:name:bool` indicating if each subclass is excluded or not.
	 */
	addToFilters (cls, isExcluded, opts) {
		super.addToFilters(cls, isExcluded, opts);

		if (isExcluded) return;

		this._levelFilter.addItem(cls._fLevelRange);
	}

	async _pPopulateBoxOptions (opts) {
		await super._pPopulateBoxOptions(opts);

		opts.filters = [
			this._sourceFilter,
			this._miscFilter,
			this._levelFilter,
			this._optionsFilter,
		];
	}

	static _getIsClassNaturallyDisplayedToDisplayParams (cls) {
		return [cls._fSources, cls._fMisc, cls._fLevelRange];
	}

	_getToDisplayParams (values, cls) {
		return [
			this.isAnySubclassDisplayed(values, cls)
				? cls._fSourceSubclass
				: cls._fSources,
			cls._fMisc,
			cls._fLevelRange,
		];
	}
}

globalThis.PageFilterClasses = PageFilterClasses;

class ModalFilterClasses extends ModalFilterBase {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 */
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Class${opts.isRadio ? "" : "es"}`,
			pageFilter: new PageFilterClasses(),
		});
	}

	_getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "4"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilterBase._getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		return [
			...(await DataLoader.pCacheAndGetAllSite(UrlUtil.PG_CLASSES)),
			...((await DataUtil.class.loadPrerelease()).class || []),
			...((await DataUtil.class.loadBrew()).class || []),
		];
	}

	_getListItem (pageFilter, cls, cI) {
		const eleRow = document.createElement("div");
		eleRow.className = "ve-px-0 ve-w-100 ve-flex-col ve-no-shrink";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](cls);
		const source = Parser.sourceJsonToAbv(cls.source);

		eleRow.innerHTML = `<div class="ve-w-100 ve-flex-vh-center ve-lst__row-border veapp__list-row ve-no-select ve-lst__wrp-cells">
			<div class="ve-col-0-5 ve-pl-0 ve-flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="ve-no-events">` : `<input type="checkbox" class="ve-no-events">`}</div>

			<div class="ve-col-0-5 ve-px-1 ve-flex-vh-center">
				<div class="ve-ui-list__btn-inline ve-px-2 ve-no-select" title="Toggle Preview (SHIFT to Toggle Info Preview)">[+]</div>
			</div>

			<div class="ve-col-4 ve-px-1 ${cls._versionBase_isVersion ? "ve-italic" : ""} ${this._getNameStyle()}">${cls._versionBase_isVersion ? `<span class="ve-px-3"></span>` : ""}${cls.name}</div>
			<div class="ve-col-1 pl-1 ve-pr-0 ve-flex-h-center ${Parser.sourceJsonToSourceClassname(cls.source)}" title="${Parser.sourceJsonToFull(cls.source)}">${source}${Parser.sourceJsonToMarkerHtml(cls.source, {isList: true})}</div>
		</div>`;

		const btnShowHidePreview = eleRow.firstElementChild.children[1].firstElementChild;

		const listItem = new ListItem(
			cI,
			eleRow,
			cls.name,
			{
				hash,
				source,
				sourceJson: cls.source,
				...ListItem.getCommonValues(cls),
				cleanName: PageFilterClasses.getListAliases(cls),
				alias: PageFilterClasses.getListAliases(cls),
			},
			{
				cbSel: eleRow.firstElementChild.firstElementChild.firstElementChild,
				btnShowHidePreview,
			},
		);

		ListUiUtil.bindPreviewButton(UrlUtil.PG_CLASSES, this._allData, listItem, btnShowHidePreview);

		return listItem;
	}
}

globalThis.ModalFilterClasses = ModalFilterClasses;
