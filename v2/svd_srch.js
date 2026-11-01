var SavedSearch = {
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}

		TopTabs.showTab("Menu.Search");
		TopTabs.select("Search.Saved");
		
		_HS( _A(_CL("Contents"),"div",{"class":"pg_header title"}), "svd_srch.page_title" );
		_A( "Contents","div",{id:"SvdSearchList", "class":"pg_body"} );
		this.onchange();
	},
	onchange:function(){
		_A( _CL("SvdSearchList"), this.render());
	},
	render:function(onload){
		var ret = _C("div",{"class":"svd_srch_list"},KUI.getProgress());
		Http.getCGI( gCGI.savedQueries, {},
			function(response){
				_H("Debug", response);
				var res =JSN(response);
				_CL(ret);
				Enum( res.child_list, 
					function(info){	
						_A( ret, SavedSearch.renderItem( info, ret ) );
					}
				);
				if(onload){
					onload(res);
				}	
			}
		);
		return ret;
	},
	renderItem:function( info, root ){
		var params = PgNav.query2Hash(info.query);
		var cYear=(new Date().getFullYear());
		var tbl = DU.createTable({"class":"svd_srch_item"},[{},{"class":"href"}]);
		var ret = tbl.table;//_C("div",{"class":"svd_srch_item"});
		if( _N(info.query_id) ){
			_A( tbl.cols[0], "span", {"class":"btn delete"} ).onclick=function(){
				KUI.confirm( "svd_srch.del_confirm", function(){
					Http.post({
						scr:"delete_search.js.pl",
						data: {sid:info.id},
						onload:function(res){
							DU.replace(root, SavedSearch.render());
						},
						refresh:1
					});
				});
			};
		}

		
		//var filters = _A(ret,"div",{"class":"href"});
		var filters = tbl.cols[1];
		filters.onclick = function(){
			PgNav.open("list",params,true);
			if(info.id){
				Http.postCGI(gCGI.promote_fav_search,{
					sid:info.id,
					memid:SSN.id
				});
			}
		};

		_A(filters, "span", {}, _S("search_lists." + (params.ls||"act") ) );
		
		Enum( KUI.fids, function(dkey,pi){
			var pval = params[pi];
			if( _D(pval) && (pval!="0"||pi=="g") && pval != "" ){
				//var title = _S("filters_title." + pi,"") + KUI.filterText(pi, pval,{});
				_HSEP(filters);
				KUI.setAttrText({ el:_A(filters, "span"), param:pi, dkey:pi, data:params, prefix:"filters_title." + pi });
			}
			
		});

		_HSEP(filters);
		_A( filters, "span",{}, _S("a.order") + ":" );
		_HS(_A(filters, "span"), "sort." + (params.ob||"rl") );
		if(params.m){
			_HSEP(filters);
			_HS(_A(filters, "span"), "sort.m");
			params.m = "1";
		}

		return ret;
	}
};