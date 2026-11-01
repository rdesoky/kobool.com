/**
 * Created by rdeso_000 on 1/6/2015.
 */
define(["jquery", "utils","dom-utils","page-nav","kui","http","k-template","top-tabs"], function($, $u,$du, pgNav,kui,$http,$ktmpl,$tabs){
	var drill;
	
	return drill = {
		requireStrings:["str:filters","str:filters_title","options:sfilters"],

		onload:function(){
			this.render();
		},

		onchange:function(){
			this.render();
		},

		render:function(){
			var ls = _P("ls","act");
			if( SSN.id ){
				$tabs.showTab("Menu.Profile");
				$tabs.select("Profile."+ls);
			}else{
				$tabs.select("GuestMenu.search");
			}

			document.title = _S("a.kobool") + " - " + _S("a.pg_title.drill" ) + " - " + _S("a.pg_title." + ls) + kui.SFilters2String();

			var pr = _R( kui.blockedEl("PageRoot") );
			var root = _A( _CL("Contents"), "div", {}, pr );
			var params = $u.searchParams({to:1});
			$http.getCGI( $http.api.search,
				params,
				function(txt){
					_CL(root);
					_SA(root,{id:"PageRoot"});

					var results=JSN(txt);

					_A(root, "div", {"class":"pg_header"}, kui.renderSFilters({res: results}));

					var params = $u.searchParams();

					var sum_root = _A(root,"div", {id:"DrillPanel","class":"pg_body"});

					if(_D(params.sum)){
						_A( sum_root,"div",{"class":"drill_btn drill_hdr_btn dr_" + params.sum }, [
							_HS( _C("span"), "filters." + params.sum )
						]).onclick=function(){
							pgNav.chgParams({},["sum"],true	);
						};
						_A( sum_root, drill.renderSummary(params) );
					}else{
						drill.renderButtons(sum_root, params);
					}
				}
			);
		},
		renderButtons:function(root, params){
			params = params || {};
			$.each( kui.fids, function(dkey,f){
				switch(f){
					case "ci":if(!_D(params.st)){return;}
					case "st":if(!_D(params.c)){return;}
						break;
					case "po":
					case "dt":
						if(params.g==="0"){return;}
				}
				if(!_D(params[f]) ){
					var el = _A(root,"div",{"class":"drill_btn dr_" + f },[
						_HS( _C("span"), "filters." + f )
					]);

					$(el).click(function(){
						pgNav.chgParams({pg:"drill", sum:f},[],true	);
					});
				}
			});
		},
		renderSummary:function(){
			var root = _C("div",{"class":"summary_list"});

			var pr = _A( root, kui.getProgress(),{}, undefined, true );
			var sum = _P("sum");
			var spr = $u.arrFind(["ag","ht","wt"], sum) ? "5" : false;
			var params = $u.searchParams({spr:spr});
			delete params[sum];

			$http.getCGI( $http.api.summary,
				params,
				function(txt){
					_R(pr);
					var results = JSN(txt);
					var total = _N(results.total_members);
					var template = $ktmpl.html2Template(
						'<div class="summary_line">' +
						"<span class='sum_group_name'></span>" +
						"<span class='sum_mem_percent' data-js-attr='innerHTML'>({{percent}}%)</span>" +
						"<span class='sum_mem_count' data-js-attr='innerHTML'>{{members_count}}</span>" +
						"</div>"
					);

					$.each( results.child_list, function(item){
						item.percent = Math.floor(_N(item.members_count)*1000/total)/10;

						var dom = template(item);

						var add={};add[sum]=item.group_name;

						$(".summary_line",dom).click(function(){
							pgNav.open("drill",add,["sum"]);
						});
						$(".sum_mem_count",dom).click(function(e){
							pgNav.open("list",add,["sum","p"]);
							e.stopPropagation();
						});

						kui.setAttrText({el:$(".sum_group_name",dom).dom(), param:sum, data:item, dkey:"group_name"});

						_A(root, dom);

					});
					//_A(root,tbl.table);
				}
			);
			return root;
		}

	}
});
