define(["jquery","dom-utils", "kui","utils","http","page-nav","top-tabs"],function($,$du,kui,$u,$http,$pgNav,$tabs){
	var svd_srch;
	return svd_srch = {
		onload: function () {
			if (!kui.chkLogin({nav: true})) {
				return;
			}

			$tabs.showTab("Menu.Search");
			$tabs.select("Search.Saved");

			_HS(_A(_CL("Contents"), "div", {"class": "pg_header title"}), "svd_srch.page_title");
			_A("Contents", "div", {id: "SvdSearchList", "class": "pg_body"});
			this.onchange();
		},
		onchange: function () {
			_A(_CL("SvdSearchList"), this.render());
		},
		render: function (onload) {
			var ret = _C("div", {"class": "svd_srch_list"}, kui.getProgress());
			$http.getCGI($http.api.savedQueries, {},
				function (response) {
					var res = JSN(response);
					_CL(ret);
					$.each(res.child_list,
						function (info) {
							_A(ret, svd_srch.renderItem(info, ret));
						}
					);
					if (onload) {
						onload(res);
					}
				}
			);
			return ret;
		},
		renderItem: function (info, root) {
			var params = $u.query2Hash(info.query);
			var cYear = (new Date().getFullYear());
			var tbl = $du.createTable({"class": "svd_srch_item"}, [{}, {"class": "href"}]);
			var ret = _C("div", {"class": "svd_srch_item"});
			if (_N(info.query_id)) {
				_A(ret, "span", {"class": "btn delete"}).onclick = function () {
					kui.confirm("svd_srch.del_confirm", function () {
						$http.post({
							scr: $http.api.delete_search,
							data: {sid: info.id},
							onload: function (res) {
								$du.replace(root, svd_srch.render());
							},
							refresh: 1
						});
					});
				};
			}


			//var filters = _A(ret,"div",{"class":"href"});
			var filters = _A(ret, "span");
			filters.onclick = function () {
				$pgNav.open("list", params, true);
				if (info.id) {
					$http.postCGI($http.api.promote_fav_search, {
						sid: info.id,
						memid: SSN.id
					});
				}
			};

			_A(filters, "span", {}, _S("search_lists." + (params.ls || "act")));

			$.each(kui.fids, function (dkey, pi) {
				var pval = params[pi];
				if (_D(pval) && (pval != "0" || pi == "g") && pval != "") {
					//var title = _S("filters_title." + pi,"") + kui.filterText(pi, pval,{});
					_HSEP(filters);
					kui.setAttrText({
						el: _A(filters, "span"),
						param: pi,
						dkey: pi,
						data: params,
						prefix: "filters_title." + pi
					});
				}

			});

			_HSEP(filters);
			_A(filters, "span", {}, _S("a.order") + ":");
			_HS(_A(filters, "span"), "sort." + (params.ob || "rl"));
			if (params.m) {
				_HSEP(filters);
				_HS(_A(filters, "span"), "sort.m");
				params.m = "1";
			}

			return ret;
		}
	}
});