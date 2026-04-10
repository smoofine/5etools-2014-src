import {BaseComponent} from "./basecomponent.js";
import {StatGenUtilAdditionalFeats} from "./charactercreator-util-additionalfeats.js";

export class StatGenUiCompCharacterLvlUp extends BaseComponent {
	constructor ({parent}) {
		super();
		this._parent = parent;
		
		this._metasAsi = {ability: [], race: [], background: [], custom: []};
		
		this._doPulseThrottled = MiscUtil.throttle(this._doPulse_.bind(this), 50);
	}

	/**
	 * Add this to UI interactions rather than state hooks, as there is a copy of this component per tab.
	 */
	_doPulse_ () { this._parent.state.common_pulseAsi = !this._parent.state.common_pulseAsi; }

	_render_renderAsiFeatSection (propCnt, namespace, wrpRows) {
		const hk = () => {
			let ix = 0;

			for (; ix < this._parent.state[propCnt]; ++ix) {
				const ix_ = ix;
				const {propMode, propIxFeat, propIxAsiPointOne, propIxAsiPointTwo, propIxFeatAbility, propFeatAbilityChooseFrom} = this._parent.getPropsAsi(ix_, namespace);

				if (!this._metasAsi[namespace][ix_]) {
					this._parent.state[propMode] = this._parent.state[propMode] || (namespace === "ability" ? "asi" : "feat");

					const btnAsi = namespace !== "ability" ? null : ee`<button class="ve-btn ve-btn-xs ve-btn-default ve-w-50p">ASI</button>`
						.onn("click", () => {
							this._parent.state[propMode] = "asi";
							this._doPulseThrottled();
						});

					const btnFeat = namespace !== "ability" ? ee`<div class="ve-w-100p ve-text-center">Feat</div>` : ee`<button class="ve-btn ve-btn-xs ve-btn-default ve-w-50p">Feat</button>`
						.onn("click", () => {
							this._parent.state[propMode] = "feat";
							this._doPulseThrottled();
						});

					// region ASI
					let stgAsi;
					if (namespace === "ability") {
						const colsAsi = Parser.ABIL_ABVS.map((it, ixAsi) => {
							const updateDisplay = () => ipt.val(Number(this._parent.state[propIxAsiPointOne] === ixAsi) + Number(this._parent.state[propIxAsiPointTwo] === ixAsi));

							const ipt = ee`<input class="ve-form-control form-control--minimal ve-text-right ve-input-xs ve-statgen-shared__ipt" type="number" style="width: 42px;">`
								.disableSpellcheck()
								.onn("keydown", evt => { if (evt.key === "Escape") ipt.blure(); })
								.onn("change", () => {
									const raw = ipt.val().trim();
									const asNum = Number(raw);

									const activeProps = [propIxAsiPointOne, propIxAsiPointTwo].filter(prop => this._parent.state[prop] === ixAsi);

									if (isNaN(asNum) || asNum <= 0) {
										this._parent.proxyAssignSimple(
											"state",
											{
												...activeProps.mergeMap(prop => ({[prop]: null})),
											},
										);
										updateDisplay();
										return this._doPulseThrottled();
									}

									if (asNum >= 2) {
										this._parent.proxyAssignSimple(
											"state",
											{
												[propIxAsiPointOne]: ixAsi,
												[propIxAsiPointTwo]: ixAsi,
											},
										);
										updateDisplay();
										return this._doPulseThrottled();
									}

									if (activeProps.length === 2) {
										this._parent.state[propIxAsiPointTwo] = null;
										updateDisplay();
										return this._doPulseThrottled();
									}

									if (this._parent.state[propIxAsiPointOne] == null) {
										this._parent.state[propIxAsiPointOne] = ixAsi;
										updateDisplay();
										return this._doPulseThrottled();
									}

									this._parent.state[propIxAsiPointTwo] = ixAsi;
									updateDisplay();
									this._doPulseThrottled();
								});

							const hkSelected = () => updateDisplay();
							this._parent.addHookBase(propIxAsiPointOne, hkSelected);
							this._parent.addHookBase(propIxAsiPointTwo, hkSelected);
							hkSelected();

							return ee`<div class="ve-flex-col">
								<label class="${Parser.ABIL_ABVS.length > 6 ? "ve-flex-col" : "ve-flex-vh-center"} ve-mb-1">
									<div class="ve-mr-2 ve-no-shrink">${Parser.abvToAb(it)}</div>
									${ipt}
								</label>
							</div>`;
						});

						stgAsi = ee`<div class="ve-flex-col ve-w-100 ve-overflow-y-auto">
							<div class="ve-flex ${Parser.ABIL_ABVS.length > 6 ? "ve-flex-wrap" : ""}">${colsAsi.join("")}</div>
						</div>`;
					}
					// endregion

					// region Feat
					let stgFeat;
					if (namespace !== "ability") {
						const wrpRowsFeat = ee`<div class="ve-flex-col ve-w-100 ve-overflow-y-auto"></div>`;
						const btnAdd = ee`<button class="ve-btn ve-btn-xs ve-btn-default ve-w-100p">Add Feat</button>`
							.onn("click", () => {
								this._parent.state[propCnt]++;
								this._doPulseThrottled();
							});

						stgFeat = ee`<div class="ve-flex-col ve-w-100">
							${wrpRowsFeat}
							${btnAdd}
						</div>`;
					}
					// endregion

					const row = ee`<div class="ve-flex-col ve-w-100">
						${stgAsi}
						${stgFeat}
					</div>`;

					this._metasAsi[namespace][ix_] = {
						propCnt,
						propMode,
						propIxFeat,
						propIxAsiPointOne,
						propIxAsiPointTwo,
						propIxFeatAbility,
						propFeatAbilityChooseFrom,
						wrpRowsFeat,
						btnAdd,
						row,
					};

					wrpRows.appendChild(row);
				}
			}

			// region Remove excess
			for (; ix < this._metasAsi[namespace].length; ++ix) {
				const meta = this._metasAsi[namespace][ix];
				if (meta && meta.row) meta.row.remove();
				delete this._metasAsi[namespace][ix];
			}
			// endregion
		};

		this._parent.addHookBase(propCnt, hk);
		hk();
	}

	render () {
		const wrpRows = ee`<div class="ve-flex-col ve-w-100 ve-overflow-y-auto"></div>`;

		const getStgEntity = ({title, wrpRows, propEntity, propIxEntity}) => {
			const stg = ee`<div class="ve-flex-col">
				<hr class="ve-hr-3 ve-hr--dotted">
				<h4 class="ve-my-2 ve-bold">${title} Feats</h4>
				${wrpRows}
			</div>`;

			return {
				wrpOuter: ee`<div class="ve-flex-col ve-w-100"></div>`,
				stg,
			};
		};

		const stgAbility = getStgEntity({title: "Ability Score Increases", wrpRows, propEntity: "race", propIxEntity: "common_ixRace"});
		const stgBackground = getStgEntity({title: "Background", wrpRows, propEntity: "background", propIxEntity: "common_ixBackground"});

		return ee`<div class="ve-flex-col ve-w-100">
			${stgAbility.stg}
			${stgBackground.stg}
		</div>`;
	}

	// region Hooks
	_pb_unhookRender () {
		this._pbHookMetas.forEach(it => it.unhook());
		this._pbHookMetas = [];
	}
	// endregion
}
