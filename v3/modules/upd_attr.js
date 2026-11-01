/**
 * Created by rdeso_000 on 1/17/2015.
 */
define(["jquery", "top-tabs", "dom-utils", "http", "kui", "utils","page-nav"],function($, $tabs, $du, $http, $kui, $u, $pgNav) {

	return {
		onload: function () {
			if (!$kui.chkLogin({nav: true})) {
				return;
			}

			var frm = document.forms.updateAttrFrm;

			frm.onsubmit = this.onsubmit.bind(this);

			$tabs.showTab("Menu.Update");
			$tabs.select("Update.attr");

			$http.postCGI($http.api.member, {mem: _N(_GC("id"))}, function (res) {
				_E("UpdateAttr").style.visibility = "visible";
				var r = JSN(res);
				var info = r;

				if (SSN.gender != "1") {
					$du.hide("po_editor,dt_editor");//hide polygamy and cloth
				}
				frm.country.onchange = function () {
					var st = frm.state;
					_HI("StateEditor,CityEditor");
					frm.state.value =
						frm.city.value = "0";
					showStates(frm.country.value, "0", "0");
				};
				function showStates(country, state, city) {
					var st = frm.state;
					$http.get(PgLinks.geo + "&lang=" + $u.lang() + "&id=" + frm.country.value, function (res) {
						st.options.length = 1;
						var r = JSN(res);
						if (!_D(r)) {
							return;
						}
						_SH("StateEditor");
						var list = r.child_list[0];
						$.each(list, function (val, key) {
							_A(st, "option", {value: key}, val);
						});
						frm.state.value = state;
						frm.city.value = city;
					});
				}
				frm.state.onchange = function () {
					var ci = frm.city;
					_HI("CityEditor");
					frm.city.value = "0";
					showCities(frm.country.value,
						frm.state.value,
						"0"
					);
				};
				function showCities(country, state, city) {
					var ci = frm.city;
					$http.get(PgLinks.geo + "&lang=" + $u.lang() + "&id="
						+ country + "." + state,
						function (res) {
							_SH("CityEditor");
							ci.options.length = 1;
							var r = JSN(res);
							if (!_D(r)) {
								return;
							}
							var list = r.child_list[0];
							$.each(list, function (val, key) {
								_A(ci, "option", {value: key}, val);
							});
							frm.state.value = state;
							frm.city.value = city;
						});
				};

				$.each(info, function (val, filter) {
					if (_D(frm[filter])) {
						frm[filter].value = val;
					}
				});
				if (info.state) {
					showStates(info.country, info.state, info.city);
				} else {
					showStates(info.country);
				}
				if (info.city) {
					showCities(info.country, info.state, info.city);
				} else if (info.state) {
					showCities(info.country, info.state);
				}

			});
		},
		onsubmit: function (e) {
			var frm = e.target;
			$http.postUpdate($http.api.upd_my_attr, $u.form2Hash(frm), function (res) {
				if (_P("wz")) {
					$pgNav.open("upd_txt");
				} else {
					$pgNav.open("update", undefined, true);
				}
			});
			return false;
		}
	}
});