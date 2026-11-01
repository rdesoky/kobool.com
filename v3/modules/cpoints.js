/**
 * Created by rdeso_000 on 1/15/2015.
 */
define(["jquery", "page-nav", "kui","http", "str-loader","utils","check-frame"],function($, $pgNav, $kui, $http, $strLoader,$u, CCheckFrame) {
	var module;

	return module = {
		memInfo : null,

		renderEulaCheckLine: function (root, page_name) {
			var eulaLine = _A(root, (new CCheckFrame()).getDOM());
			var eulaChk = _A(eulaLine, "input", {
				type: "checkbox",
				name: "eula_ok",
				id: "eula_check",
				checked: _N(_P("accept")) ? true : false
			});
			var el = _A(eulaLine, "span");
			$strLoader.requireStrings("cpoints:ui", function () {
				var str = _S("cpoints:ui.eula_accepted");
				el.innerHTML = str.replace("href1", "class='href' onclick=\"require('page-nav').open('cp_eula',{back:'" + page_name + "'});require('dom-utils').cancelBubble(event);\"");
			});
			return {line: eulaLine, check: eulaChk};
		},

		renderLayout: function (p) {
			r = _E(p.root);

			_HS(_A(r, "div", {"class": "pg_header title"}), p.title);

			var tbl = _AT("Contents", {"class": "contents_tbl", border: 0}, [
				{"class": "left_side padding"},
				{"class": "wide_padding points_body", width: p.bodyWidth || 520},
				{"class": "padding right_align right_column"}
			]);

			var lside = tbl.cols[0];
			var body = tbl.cols[1];
			var rside = tbl.cols[2];

			_A(lside, "div", {"class": p.logo});

			module.renderViewer({root: lside, memid: _P("mem") || SSN.id || "", onfinish: p.onfinish});

			if (p.page) {
				_HS(_A(rside, "div", {"class": "center_align"}), "cpoints:ui.other_methods");
				module.renderMethods({root: rside, exclude: [p.page]});
			} else {
				_R(rside);
			}
			return body;

		},

		renderMethods: function (p) {
			var root = p.root || _C("div");
			$.each(["phone_tr"],
				function (item) {
					if (!$u.arrFind(p.exclude, item)) {
						_A(root, "li", {"class": "drill_btn payment_btn btn_" + item},
							_HS(_C("span"), "cpoints:methods." + item)
						).onclick = function () {
							$pgNav.open(item);
						};
					}
				}
			);
			return root;
		},

		renderViewer: function (p) {
			_HS(_AD(p.root), "cpoints:ui.for_member");

			var txt = _A(_A(p.root, "div", {id: "TargetMemberNum", "class": "parag"}),
				"input",
				{type: "text", style: "width:116px", "class": "", value: p.memid}
			);

			var viewer = _A(p.root, "div", {id: "TargetMemberView"});

			txt.onblur = function (e) {
				module.viewMember({root: viewer, memid: txt.value, alert: true});
			};

			if (_N(p.memid)) {
				module.viewMember({root: viewer, memid: p.memid, onfinish: p.onfinish});
			}else{
				(p.onfinish && p.onfinish(null));
			}
		},

		viewMember: function (p) {
			_A( _CL(p.root), $kui.getProgress() );

			$http.getCGI($http.api.member, {mem: p.memid}, function (res) {
				_CL(p.root);

				var r = JSN(res);
				if (_N(r.success)) {
					var m = r;
					module.memInfo = m;

					require(["mem-view25"], function (view) {
						_A(p.root, view.render(m));
					});

					if (p.onfinish) {
						p.onfinish(m);
					}
				} else {
					module.memInfo = null;

					if (p.alert) {
						$kui.msgbox({msg: "errors:error." + r.error});
					}
				}
			});
		}
	};
});