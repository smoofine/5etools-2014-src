import {StatGenUiRenderLevelOneEntityBase} from "./charactercreator-ui-comp-levelone-entitybase.js";

export class StatGenUiRenderLevelOneClass extends StatGenUiRenderLevelOneEntityBase {
	_title = "Class";
	_titleShort = "Class";
	_propIxEntity = "common_ixClass";
	_propIxAbilityScoreSet = "common_ixAbilityScoreSetClass";
	_propData = "_classes";
	_propModalFilter = "_modalFilterClasses";
	_propIsPreview = "common_isPreviewClass";
	_propEntity = "class";
	_page = UrlUtil.PG_CLASSES;
	_propChoiceMetasFrom = "common_classChoiceMetasFrom";
	_propChoiceWeighted = "common_classChoiceMetasWeighted";

	render () {
		// Initialize preview state if it doesn't exist
		if (this._parent._state[this._propIsPreview] === undefined) {
			this._parent._state[this._propIsPreview] = false;
			console.log("Initialized preview state to false");
		}
		
		// Classes have no modal filter, so we need to handle this case specially
		const wrpOuter = document.createElement("div");
		wrpOuter.className = "ve-flex-col";

		// Create the searchable selector without filter functionality
		const {wrp: selEntity, setFnFilter: setFnFilterEntity} = ComponentUiUtil.getSelSearchable(
			this._parent,
			this._propIxEntity,
			{
				values: this._parent[this._propData].map((_, i) => i),
				isAllowNull: true,
				fnDisplay: ix => {
					const r = this._parent[this._propData][ix];
					if (!r) return "(Unknown)";
					return `${r.name} ${r.source !== Parser.SRC_PHB ? `[${Parser.sourceJsonToAbv(r.source)}]` : ""}`;
				},
				asMeta: true,
			},
		);

		// Create a functional filter button
		const btnFilterForEntity = document.createElement("button");
		btnFilterForEntity.className = "ve-btn ve-btn-xs ve-btn-default ve-br-0 ve-pr-2";
		btnFilterForEntity.innerHTML = `<span class="glyphicon glyphicon-filter"></span> Filter`;
		btnFilterForEntity.title = "Filter for Class";
		
		// Add proper modal filter functionality
		btnFilterForEntity.addEventListener("click", () => {
			this._showClassFilterModal(setFnFilterEntity);
		});

		// Add preview button with manual toggle
		const btnPreview = document.createElement("button");
		btnPreview.className = "ve-btn ve-btn-xs ve-btn-default";
		btnPreview.title = "Toggle Class Preview";
		btnPreview.innerHTML = `<span class="glyphicon glyphicon-eye-open"></span>`;
		
		// Manual toggle implementation
		btnPreview.addEventListener("click", () => {
			console.log("Parent state object:", this._parent._state);
			console.log("Prop name:", this._propIsPreview);
			
			const currentState = this._parent._state[this._propIsPreview];
			console.log("Current state before toggle:", currentState);
			
			// Initialize state if it doesn't exist
			if (this._parent._state[this._propIsPreview] === undefined) {
				this._parent._state[this._propIsPreview] = false;
			}
			
			this._parent._state[this._propIsPreview] = !currentState;
			console.log("State after toggle:", this._parent._state[this._propIsPreview]);
			
			// Update button appearance
			btnPreview.classList.toggle("ve-active", this._parent._state[this._propIsPreview]);
			
			// Trigger the preview hook
			hkPreviewEntity();
		});
		
		const hkBtnPreviewEntity = () => {
			btnPreview.style.display = this._parent._state[this._propIxEntity] != null && ~this._parent._state[this._propIxEntity] ? "" : "none";
			btnPreview.classList.toggle("ve-active", this._parent._state[this._propIsPreview]);
		};
		this._parent._addHookBase(this._propIxEntity, hkBtnPreviewEntity);
		hkBtnPreviewEntity();

		// Create preview display (start hidden)
		const dispPreview = document.createElement("div");
		dispPreview.className = "ve-flex-col ve-mb-2 ve-hidden";
		dispPreview.style.display = "none";
		dispPreview.style.visibility = "hidden";
		console.log("Created preview element:", dispPreview);
		
		const hkPreviewEntity = () => {
			console.log("=== PREVIEW HOOK CALLED ===");
			console.log("Preview state:", this._parent._state[this._propIsPreview]);
			console.log("Class index:", this._parent._state[this._propIxEntity]);
			console.log("Prop name:", this._propIsPreview);
			
			// Always hide preview if toggle is off
			if (!this._parent._state[this._propIsPreview]) {
				console.log("Hiding preview - toggle is off");
				console.log("Before hide - classes:", dispPreview.className);
				console.log("Before hide - display:", dispPreview.style.display);
				dispPreview.classList.add("ve-hidden");
				dispPreview.style.display = "none";
				dispPreview.style.visibility = "hidden";
				console.log("After hide - classes:", dispPreview.className);
				console.log("After hide - display:", dispPreview.style.display);
				return;
			}

			// Check if we have a selected entity
			const entity = this._parent._state[this._propIxEntity] != null ? this._parent[this._propData][this._parent._state[this._propIxEntity]] : null;
			if (!entity) {
				console.log("Hiding preview - no entity selected");
				dispPreview.classList.add("ve-hidden");
				dispPreview.style.display = "none";
				return;
			}

			console.log("Showing preview - entity found:", entity.name);
			// Show preview and load content
			dispPreview.classList.remove("ve-hidden");
			dispPreview.style.display = "";
			dispPreview.style.visibility = "visible";
			// Clear previous content and append the new DOM element
			while (dispPreview.firstChild) {
				dispPreview.removeChild(dispPreview.firstChild);
			}
			const content = Renderer.hover.getHoverContent_stats(this._page, entity);
			if (content) {
				dispPreview.appendChild(content);
			}
		};
		this._parent._addHookBase(this._propIxEntity, hkPreviewEntity);
		this._parent._addHookBase(this._propIsPreview, hkPreviewEntity);
		hkPreviewEntity();

		// Create the selection UI using standard DOM methods
		const stgSel = document.createElement("div");
		stgSel.className = "ve-flex-col ve-mt-3";
		
		// Create title
		const titleDiv = document.createElement("div");
		titleDiv.className = "ve-mb-1 ve-bold ve-text-large redundant-entity-selection-text";
		titleDiv.textContent = "Select a Class";
		stgSel.appendChild(titleDiv);
		
		// Create button group container
		const buttonContainer = document.createElement("div");
		buttonContainer.className = "ve-flex-v-center ve-mb-2";
		
		// Create button group with filter button and selector
		const btnGroup = document.createElement("div");
		btnGroup.className = "ve-flex-v-center ve-btn-group ve-w-100 ve-mr-2";
		btnGroup.appendChild(btnFilterForEntity);
		btnGroup.appendChild(selEntity);
		
		buttonContainer.appendChild(btnGroup);
		
		// Add preview button
		const previewContainer = document.createElement("div");
		previewContainer.appendChild(btnPreview);
		buttonContainer.appendChild(previewContainer);
		
		stgSel.appendChild(buttonContainer);
		stgSel.appendChild(dispPreview);

		// Add horizontal divider
		const divider = document.createElement("hr");
		divider.className = "ve-hr-3 ve-mt-4 ve-mb-4";
		wrpOuter.appendChild(divider);

		const out = {
			wrpOuter,
			stgSel,
			dispPreview,
			hrPreview: null,
			divider,
		};

		// Add subclass selection
		const {stgSubclass, dispSubclass} = this._getPtsSubclass();
		out.stgSel.appendChild(stgSubclass);
		out.dispSubclass = dispSubclass;

		// Add starting skills
		const {stgSkills, dispSkills} = this._getPtsSkills();
		out.stgSel.appendChild(stgSkills);
		out.dispSkills = dispSkills;

		// Add starting equipment
		const {stgEquipment, dispEquipment} = this._getPtsEquipment();
		out.stgSel.appendChild(stgEquipment);
		out.dispEquipment = dispEquipment;

		wrpOuter.appendChild(stgSel);

		return out;
	}

	_pb_getAbilityList () {
		return this._parent._pb_getClassAbilityList();
	}

	_pb_getAbility () {
		return this._parent._pb_getClassAbility();
	}

	_showClassFilterModal (setFnFilterEntity) {
		// Create filter content
		const filterContent = this._createFilterContent(setFnFilterEntity);
		
		// Use proper UiUtil modal system
		const modalMeta = UiUtil.getShowModal({
			title: "Class Filters",
			isHeight100: true,
			isUncappedHeight: true,
			isWidth100: true,
			isUncappedWidth: true,
			hasFooter: true,
			cbClose: () => {
				// Cleanup if needed
			}
		});

		// Add filter content to modal
		modalMeta.eleModalInner.appendChild(filterContent.content);
		
		// Add footer buttons
		const footer = modalMeta.eleModalFooter || document.createElement("div");
		footer.className = "ve-no-shrink ve-w-100 ve-flex-col ve-ui-modal__footer ve-mt-auto";
		footer.innerHTML = `
			<div class="ve-flex-v-center">
				<button class="ve-btn ve-btn-primary ve-fltr__btn-close ve-mr-2">Save</button>
				<button class="ve-btn ve-btn-default ve-fltr__btn-close">Cancel</button>
			</div>
		`;
		
		// Add event listeners to footer buttons
		const saveBtn = footer.querySelector('button.ve-btn-primary');
		if (saveBtn) {
			saveBtn.addEventListener("click", () => {
				modalMeta.doClose(true);
			});
		}
		
		const cancelBtn = footer.querySelector('button.ve-btn-default');
		if (cancelBtn) {
			cancelBtn.addEventListener("click", () => {
				modalMeta.doClose(false);
			});
		}
		
		// Focus search input
		setTimeout(() => {
			const searchInput = filterContent.searchInput;
			if (searchInput && searchInput.focus) searchInput.focus();
		}, 100);
	}

	_createFilterContent (setFnFilterEntity) {
		// Create main content container
		const content = document.createElement("div");
		content.className = "ve-flex-col ve-w-100 ve-h-100";
		
		// Create search section
		const searchSection = document.createElement("div");
		searchSection.className = "ve-split ve-mb-2 ve-mt-2 ve-flex-v-center ve-mobile-sm__flex-col";
		searchSection.innerHTML = `
			<div class="ve-flex-v-baseline ve-mobile-sm__flex-col">
				<h4 class="ve-m-0 ve-mr-2 ve-mobile-sm__mb-2">Filters</h4>
				<div class="ve-relative ve-w-100 ve-mobile-sm__mb-2">
					<input class="ve-form-control ve-input-xs ve-ui-ideco__ipt ve-ui-ideco__ipt--right" 
						   placeholder="Search..." 
						   autocomplete="new-password" 
						   autocapitalize="off" 
						   spellcheck="false">
					<div class="ve-ui-ideco__wrp ve-ui-ideco__wrp--right ve-flex-vh-center ve-clickable" title="Clear">
						<span class="glyphicon glyphicon-remove"></span>
					</div>
				</div>
			</div>
		`;
		
		// Create filter content scroller
		const filterScroller = document.createElement("div");
		filterScroller.className = "ve-ui-modal__scroller ve-smooth-scroll ve-px-1";
		
		// Create source pills section
		const sourceSection = this._createSourcePills();
		
		// Create miscellaneous section
		const miscSection = this._createMiscellaneousFilters();
		
		// Create feature level section
		const featureLevelSection = this._createFeatureLevelFilters();
		
		// Create other options section
		const otherOptionsSection = this._createOtherOptions();
		
		// Assemble filter content
		filterScroller.appendChild(sourceSection);
		filterScroller.appendChild(miscSection);
		filterScroller.appendChild(featureLevelSection);
		filterScroller.appendChild(otherOptionsSection);
		
		// Assemble content
		content.appendChild(searchSection);
		content.appendChild(filterScroller);
		
		// Add search functionality
		const searchInput = searchSection.querySelector("input");
		const clearBtn = searchSection.querySelector(".ve-ui-ideco__wrp");
		
		// The search functionality will be handled by the main searchable selector
		// This modal is only for filter options, not class selection
		clearBtn.addEventListener("click", () => {
			searchInput.value = "";
		});
		
		return {
			content,
			searchInput
		};
	}

	_createSourcePills () {
		const sourceSection = document.createElement("div");
		sourceSection.className = "ve-flex-col";
		
		// Create source header
		const sourceHeader = document.createElement("div");
		sourceHeader.className = "ve-split ve-fltr__h ve-mb-1";
		sourceHeader.innerHTML = `
			<div class="ve-fltr__h-text ve-flex-h-center ve-mobile-sm__w-100">
				<span>Source</span>
				<button class="ve-btn ve-btn-xs ve-btn-default ve-mobile-sm__visible ve-ml-auto ve-px-3 ve-mr-2">
					<span class="glyphicon glyphicon-option-vertical"></span>
				</button>
			</div>
			<div class="ve-flex-v-center ve-fltr__h-wrp-btns-outer ve-mobile-sm__hidden">
				<div class="ve-flex-vh-center ve-hidden"></div>
				<div class="ve-flex-v-center ve-fltr__h-wrp-state-btns-outer">
					<div class="ve-btn-group ve-flex-v-center ve-w-100">
						<button class="ve-btn ve-btn-default ve-btn-xs ve-fltr__h-btn--all ve-w-100">All</button>
						<button class="ve-btn ve-btn-default ve-btn-xs ve-fltr__h-btn--clear ve-w-100">Clear</button>
						<button class="ve-btn ve-btn-default ve-btn-xs ve-fltr__h-btn--none ve-w-100">None</button>
						<button class="ve-btn ve-btn-default ve-btn-xs ve-w-100">Default</button>
					</div>
				</div>
				<span class="ve-btn-group ve-ml-2 ve-flex-v-center">
					<button class="ve-btn ve-btn-default ve-btn-xs ve-fltr__h-btn-logic--blue ve-fltr__h-btn-logic ve-w-100" title="Blue match mode for this filter.">OR</button>
					<button class="ve-btn ve-btn-default ve-btn-xs ve-fltr__h-btn-logic--red ve-fltr__h-btn-logic ve-w-100" title="Red match mode for this filter.">OR</button>
				</span>
				<div class="ve-btn-group ve-flex-v-center ve-ml-2">
					<button class="ve-btn ve-btn-default ve-btn-xs">Hide</button>
					<button class="ve-btn ve-btn-default ve-btn-xs">
						<span title="Other Options" class="glyphicon glyphicon-option-vertical"></span>
					</button>
				</div>
			</div>
		`;
		
		// Create source pills container
		const sourcePillsContainer = document.createElement("div");
		sourcePillsContainer.className = "ve-fltr__wrp-pills ve-fltr__wrp-subs";
		
		// Create source pills
		const sources = [...new Set(this._parent[this._propData].map(c => c.source))];
		sources.forEach(source => {
			const pill = document.createElement("div");
			pill.className = "ve-fltr__pill";
			pill.setAttribute("data-state", "yes");
			pill.innerHTML = `
				<span class="ve-hidden">
					<span class="glyphicon glyphicon-book"></span> ${Parser.sourceJsonToAbv(source)}
				</span>
				<span class="ve-px-2 ve-fltr-src__spc-pill ve-hidden">|</span>
				<span>${Parser.sourceJsonToFull(source)}</span>
			`;
			pill.addEventListener("click", () => {
				const currentState = pill.getAttribute("data-state");
				pill.setAttribute("data-state", currentState === "yes" ? "no" : "yes");
			});
			sourcePillsContainer.appendChild(pill);
		});
		
		sourceSection.appendChild(sourceHeader);
		sourceSection.appendChild(sourcePillsContainer);
		
		return sourceSection;
	}

	_createMiscellaneousFilters () {
		const miscSection = document.createElement("div");
		miscSection.className = "ve-flex-col";
		
		// Create misc header
		const miscHeader = document.createElement("div");
		miscHeader.className = "ve-split ve-fltr__h ve-mb-1";
		miscHeader.innerHTML = `
			<div class="ve-fltr__h-text ve-flex-h-center ve-mobile-sm__w-100">
				<span>Miscellaneous</span>
				<button class="ve-btn ve-btn-xs ve-btn-default ve-mobile-sm__visible ve-ml-auto ve-px-3 ve-mr-2">
					<span class="glyphicon glyphicon-option-vertical"></span>
				</button>
			</div>
			<div class="ve-flex-v-center ve-fltr__h-wrp-btns-outer ve-mobile-sm__hidden">
				<div class="ve-flex-vh-center ve-hidden"></div>
				<div class="ve-flex-v-center ve-fltr__h-wrp-state-btns-outer">
					<div class="ve-btn-group ve-flex-v-center ve-w-100">
						<button class="ve-btn ve-btn-default ve-btn-xs ve-fltr__h-btn--all ve-w-100">All</button>
						<button class="ve-btn ve-btn-default ve-btn-xs ve-fltr__h-btn--clear ve-w-100">Clear</button>
						<button class="ve-btn ve-btn-default ve-btn-xs ve-fltr__h-btn--none ve-w-100">None</button>
					</div>
				</div>
				<span class="ve-btn-group ve-ml-2 ve-flex-v-center">
					<button class="ve-btn ve-btn-default ve-btn-xs ve-fltr__h-btn-logic--blue ve-fltr__h-btn-logic ve-w-100" title="Blue match mode for this filter.">OR</button>
					<button class="ve-btn ve-btn-default ve-btn-xs ve-fltr__h-btn-logic--red ve-fltr__h-btn-logic ve-w-100" title="Red match mode for this filter.">OR</button>
				</span>
				<div class="ve-btn-group ve-flex-v-center ve-ml-2">
					<button class="ve-btn ve-btn-default ve-btn-xs">Hide</button>
					<button class="ve-btn ve-btn-default ve-btn-xs">
						<span title="Other Options" class="glyphicon glyphicon-option-vertical"></span>
					</button>
				</div>
			</div>
		`;
		
		// Create misc pills container
		const miscPillsContainer = document.createElement("div");
		miscPillsContainer.className = "ve-fltr__wrp-pills ve-fltr__wrp-pills--flex";
		
		// Create misc pills
		const miscOptions = ["Reprinted", "Sidekick", "Legacy"];
		miscOptions.forEach(option => {
			const pill = document.createElement("div");
			pill.className = "ve-fltr__pill";
			pill.setAttribute("data-state", "no");
			pill.textContent = option;
			pill.addEventListener("click", () => {
				const currentState = pill.getAttribute("data-state");
				pill.setAttribute("data-state", currentState === "yes" ? "no" : "yes");
			});
			miscPillsContainer.appendChild(pill);
		});
		
		miscSection.appendChild(document.createElement("div")).className = "ve-fltr__dropdown-divider ve-mb-1";
		miscSection.appendChild(miscHeader);
		miscSection.appendChild(miscPillsContainer);
		
		return miscSection;
	}

	_createFeatureLevelFilters () {
		const featureLevelSection = document.createElement("div");
		featureLevelSection.className = "ve-flex-col";
		
		// Create feature level header
		const featureHeader = document.createElement("div");
		featureHeader.className = "ve-split ve-fltr__h ve-mb-1";
		featureHeader.innerHTML = `
			<div class="ve-fltr__h-text ve-flex-h-center">
				<span>Feature Level</span>
				<button class="ve-btn ve-btn-xs ve-btn-default ve-mobile-sm__visible ve-ml-auto ve-px-3 ve-mr-2">
					<span class="glyphicon glyphicon-option-vertical"></span>
				</button>
			</div>
			<div class="ve-flex-v-center ve-mobile-sm__hidden">
				<div>
					<button class="ve-btn ve-btn-default ve-btn-xs ve-mr-2">Show as Dropdowns</button>
					<button class="ve-btn ve-btn-default ve-btn-xs">Reset</button>
				</div>
				<div class="ve-flex-v-center ve-fltr__summary_item ve-fltr__summary_item--include ve-hidden"></div>
				<div class="ve-btn-group ve-flex-v-center ve-ml-2">
					<button class="ve-btn ve-btn-default ve-btn-xs">Hide</button>
					<button class="ve-btn ve-btn-default ve-btn-xs">
						<span title="Other Options" class="glyphicon glyphicon-option-vertical"></span>
					</button>
				</div>
			</div>
		`;
		
		// Create level slider
		const levelSlider = document.createElement("div");
		levelSlider.className = "ve-fltr__wrp-pills ve-fltr__wrp-pills--flex";
		levelSlider.innerHTML = `
			<div class="ve-flex-col ve-w-100 ve-ui-slidr__wrp ve-touch-action-none">
				<div class="ve-flex-v-center ve-w-100 ve-ui-slidr__wrp-top">
					<div class="ve-overflow-hidden ve-ui-slidr__disp-value ve-no-shrink ve-no-grow ve-no-wrap ve-flex-vh-center ve-bold ve-no-select ve-ui-slidr__disp-value--visible ve-ui-slidr__disp-value--left" title="1">1</div>
					<div class="ve-flex-v-center ve-w-100 ve-h-100 ve-ui-slidr__wrp-track ve-clickable">
						<div class="ve-relative ve-w-100 ve-ui-slidr__track-outer">
							<div class="ve-ui-slidr__track-inner ve-h-100 ve-absolute" style="left: 0%; right: 0%;"></div>
							<div class="ve-ui-slidr__thumb ve-absolute ve-clickable ve-touch-action-none" draggable="true" style="left: calc(0% - 8px);"></div>
						</div>
					</div>
				</div>
			</div>
		`;
		
		featureLevelSection.appendChild(document.createElement("div")).className = "ve-fltr__dropdown-divider ve-mb-1";
		featureLevelSection.appendChild(featureHeader);
		featureLevelSection.appendChild(levelSlider);
		
		return featureLevelSection;
	}

	_createOtherOptions () {
		const otherOptionsSection = document.createElement("div");
		otherOptionsSection.className = "ve-flex-col";
		
		// Create other options header
		const otherHeader = document.createElement("div");
		otherHeader.className = "ve-split ve-fltr__h ve-mb-1";
		otherHeader.innerHTML = `
			<div class="ve-fltr__h-text ve-flex-h-center">
				<span>Other/Text Options</span>
			</div>
			<div class="ve-flex-v-center">
				<div class="ve-flex-v-center">
					<button class="ve-btn ve-btn-default ve-btn-xs">Reset</button>
				</div>
				<div class="ve-flex-v-center ve-fltr__summary_item ve-fltr__summary_item--include ve-hidden"></div>
				<div class="ve-btn-group ve-flex-v-center ve-ml-2">
					<button class="ve-btn ve-btn-default ve-btn-xs">Hide</button>
					<button class="ve-btn ve-btn-default ve-btn-xs">
						<span title="Other Options" class="glyphicon glyphicon-option-vertical"></span>
					</button>
				</div>
			</div>
		`;
		
		// Create other options pills
		const otherPillsContainer = document.createElement("div");
		otherPillsContainer.innerHTML = `
			<div class="ve-fltr__pill" data-state="no">Display Class if Any Subclass is Visible</div>
			<div class="ve-fltr__pill" data-state="yes">Class Feature Options/Variants</div>
		`;
		
		// Add click handlers to pills
		otherPillsContainer.querySelectorAll(".ve-fltr__pill").forEach(pill => {
			pill.addEventListener("click", () => {
				const currentState = pill.getAttribute("data-state");
				pill.setAttribute("data-state", currentState === "yes" ? "no" : "yes");
			});
		});
		
		otherOptionsSection.appendChild(document.createElement("div")).className = "ve-fltr__dropdown-divider ve-mb-1";
		otherOptionsSection.appendChild(otherHeader);
		otherOptionsSection.appendChild(otherPillsContainer);
		
		return otherOptionsSection;
	}

	_getPtsSubclass () {
		const stgSubclass = document.createElement("div");
		stgSubclass.className = "ve-flex-col ve-w-100";
		
		// Get class-specific subclass terminology
		const getSubclassLabel = (className) => {
			switch (className) {
				case "Cleric": return "Divine Domain";
				case "Sorcerer": return "Sorcerous Origin";
				case "Warlock": return "Otherworldly Patron";
				default: return "Subclass"; // Show "Subclass" for all other classes
			}
		};

		const currentClass = this._parent.class;
		const subclassLabel = currentClass ? getSubclassLabel(currentClass.name) : "Subclass";

		// Always create the structure
		stgSubclass.innerHTML = `
			<div class="ve-mb-1 ve-bold ve-text-large">${subclassLabel}</div>
			<div class="ve-flex-col" id="class-subclass-container">
				<div class="ve-italic ve-muted">Select a class to see ${subclassLabel.toLowerCase()} options...</div>
			</div>
		`;

		const dispSubclass = document.createElement("div");
		dispSubclass.className = "ve-flex-col";

		// Hook to update subclass selection when class changes
		const hkClass = async () => {
			const classData = this._parent.class;
			if (!classData) {
				stgSubclass.style.display = "none";
				return;
			}

			// Always show the section
			stgSubclass.style.display = "";
			
			// Get the appropriate label for this class
			const newSubclassLabel = getSubclassLabel(classData.name);
			const labelElement = stgSubclass.querySelector(".ve-bold");
			if (labelElement) labelElement.textContent = newSubclassLabel;

			const container = stgSubclass.querySelector("#class-subclass-container");
			
			// Use dropdown for Cleric, Sorcerer, and Warlock
			if (["Cleric", "Sorcerer", "Warlock"].includes(classData.name)) {
				const subclassHtml = await this._renderSubclassDropdown(classData.name, newSubclassLabel);
				if (container) container.innerHTML = subclassHtml;
			} else {
				// Use original method for other classes
				const subclassData = this._parseClassSubclasses(classData);
				const subclassHtml = this._renderSubclassSelection(subclassData, newSubclassLabel);
				if (container) container.innerHTML = subclassHtml;
			}
		};
		this._parent._addHookBase("common_ixClass", hkClass);
		
		// Initial state - hide if no class selected
		if (!currentClass) {
			stgSubclass.style.display = "none";
		}

		return {
			stgSubclass,
			dispSubclass,
		};
	}

	_parseClassSubclasses (classData) {
		if (!classData.subclasses || !classData.subclasses.length) {
			return null;
		}

		return {
			subclasses: classData.subclasses.map(sc => ({
				name: sc.name,
				shortName: sc.shortName || sc.name,
				source: sc.source,
				levels: sc.levels || []
			}))
		};
	}

	_renderSubclassSelection (subclassData, subclassLabel = "Subclass") {
		if (!subclassData || !subclassData.subclasses.length) {
			return `<div class="ve-italic ve-muted">No ${subclassLabel} at level 1.</div>`;
		}

		return `<div class="ve-flex-col">
			${subclassData.subclasses.map(sc => `
				<div class="ve-flex-v-center ve-py-1 ve-px-2 ve-clickable ve-border ve-rounded ve-mb-1" data-subclass-name="${sc.name}" data-subclass-source="${sc.source}">
					<div class="ve-flex-col">
						<div class="ve-bold">${sc.name}</div>
						<div class="ve-small ve-muted">${sc.source !== Parser.SRC_PHB ? `[${Parser.sourceJsonToAbv(sc.source)}]` : ""}</div>
					</div>
				</div>
			`).join('')}
		</div>`;
	}

	async _getSubclassOptionsFromLookup (className) {
		try {
			const subclassLookup = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/gendata-subclass-lookup.json`);
			const classData = this._parent.class;
			
			if (!classData || !subclassLookup[classData.source] || !subclassLookup[classData.source][className]) {
				return [];
			}

			const classSubclasses = subclassLookup[classData.source][className];
			const options = [];

			// Iterate through all sources for this class
			Object.keys(classSubclasses).forEach(source => {
				const sourceSubclasses = classSubclasses[source];
				Object.keys(sourceSubclasses).forEach(subclassKey => {
					const subclass = sourceSubclasses[subclassKey];
					options.push({
						name: subclass.name,
						shortName: subclassKey,
						source: source
					});
				});
			});

			return options.sort((a, b) => a.name.localeCompare(b.name));
		} catch (e) {
			console.error("Failed to load subclass lookup data:", e);
			return [];
		}
	}

	async _renderSubclassDropdown (className, subclassLabel) {
		const subclassOptions = await this._getSubclassOptionsFromLookup(className);
		
		if (!subclassOptions.length) {
			return `<div class="ve-italic ve-muted">No ${subclassLabel} at level 1.</div>`;
		}

		return `<div class="ve-flex-col">
			<select class="ve-form-control ve-input-xs form-control--minimal ve-mb-2" id="subclass-select">
				<option value="">Select a ${subclassLabel.toLowerCase()}...</option>
				${subclassOptions.map(option => `
					<option value="${option.shortName}" data-source="${option.source}">
						${option.name}${option.source !== "PHB" ? ` [${Parser.sourceJsonToAbv(option.source)}]` : ""}
					</option>
				`).join('')}
			</select>
		</div>`;
	}

	_getPtsSkills () {
		const stgSkills = document.createElement("div");
		stgSkills.className = "ve-flex-col ve-w-100";
		stgSkills.innerHTML = `
			<div class="ve-mb-1 ve-bold ve-text-large">Starting Skills</div>
			<div class="ve-flex-col" id="class-skills-container">
				<div class="ve-italic ve-muted">Select a class to see skill options...</div>
			</div>
		`;

		const dispSkills = document.createElement("div");
		dispSkills.className = "ve-flex-col";

		const hkClass = () => {
			const classData = this._parent.class;
			if (!classData) {
				stgSkills.style.display = "none";
				return;
			}

			stgSkills.style.display = "";
			
			const skillsData = this._parseClassSkills(classData);
			const skillsHtml = this._renderSkillsSelection(skillsData);
			const container = stgSkills.querySelector("#class-skills-container");
			if (container) container.innerHTML = skillsHtml;
		};
		this._parent._addHookBase("common_ixClass", hkClass);
		
		const currentClass = this._parent.class;
		if (!currentClass) {
			stgSkills.style.display = "none";
		}

		return {
			stgSkills,
			dispSkills,
		};
	}

	_parseClassSkills (classData) {
		if (!classData.startingSkills || !classData.startingSkills.length) {
			return null;
		}

		return {
			skills: classData.startingSkills.map(skill => ({
				name: skill,
				selected: false
			}))
		};
	}

	_renderSkillsSelection (skillsData) {
		if (!skillsData || !skillsData.skills.length) {
			return `<div class="ve-italic ve-muted">No starting skills available.</div>`;
		}

		return `<div class="ve-flex-col">
			${skillsData.skills.map(skill => `
				<div class="ve-flex-v-center ve-py-1 ve-px-2 ve-clickable ve-border ve-rounded ve-mb-1">
					<div class="ve-bold">${skill.name}</div>
				</div>
			`).join('')}
		</div>`;
	}

	_getPtsEquipment () {
		const stgEquipment = document.createElement("div");
		stgEquipment.className = "ve-flex-col ve-w-100";
		stgEquipment.innerHTML = `
			<div class="ve-mb-1 ve-bold ve-text-large">Starting Equipment</div>
			<div class="ve-flex-col" id="class-equipment-container">
				<div class="ve-italic ve-muted">Select a class to see equipment options...</div>
			</div>
		`;

		const dispEquipment = document.createElement("div");
		dispEquipment.className = "ve-flex-col";

		const hkClass = () => {
			const classData = this._parent.class;
			if (!classData) {
				stgEquipment.style.display = "none";
				return;
			}

			stgEquipment.style.display = "";
			
			const equipmentData = this._parseClassEquipment(classData);
			const equipmentHtml = this._renderEquipmentSelection(equipmentData);
			const container = stgEquipment.querySelector("#class-equipment-container");
			if (container) container.innerHTML = equipmentHtml;
		};
		this._parent._addHookBase("common_ixClass", hkClass);
		
		const currentClass = this._parent.class;
		if (!currentClass) {
			stgEquipment.style.display = "none";
		}

		return {
			stgEquipment,
			dispEquipment,
		};
	}

	_parseClassEquipment (classData) {
		if (!classData.startingEquipment || !classData.startingEquipment.length) {
			return null;
		}

		return {
			equipment: classData.startingEquipment.map(item => ({
				name: item,
				selected: false
			}))
		};
	}

	_renderEquipmentSelection (equipmentData) {
		if (!equipmentData || !equipmentData.equipment.length) {
			return `<div class="ve-italic ve-muted">No starting equipment available.</div>`;
		}

		return `<div class="ve-flex-col">
			${equipmentData.equipment.map(item => `
				<div class="ve-flex-v-center ve-py-1 ve-px-2 ve-clickable ve-border ve-rounded ve-mb-1">
					<div class="ve-bold">${item.name}</div>
				</div>
			`).join('')}
		</div>`;
	}
}
