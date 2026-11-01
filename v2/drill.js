var Drill = {
	onload:function(){
		this.render();
	},

	onchange:function(){
		this.render();
	},

	render:function(){
		var ls = _P("ls","act");
		if( SSN.id ){
			TopTabs.showTab("Menu.Profile");
			TopTabs.select("Profile."+ls);
		}else{
			TopTabs.select("GuestMenu.search");
		}

		document.title = _S("a.kobool") + " - " + _S("a.pg_title.drill" ) + " - " + _S("a.pg_title." + ls) + KUI.SFilters2String();

		var pr = _R( KUI.blockedEl("PageRoot") );
		var root = _A( _CL("Contents"), "div", {}, pr );
		var params = PgNav.searchParams({to:1});
		Http.getCGI( gCGI.search, 
			params,
			function(res){
				_CL(root);
				_SA(root,{id:"PageRoot"});

				var results=JSN(res);

				_A(root, "div", {"class":"pg_header"}, KUI.renderSFilters({res: results}));

				var params = PgNav.searchParams();
				
				var sum_root = _A(root,"div", {id:"DrillPanel","class":"pg_body"});

				if(_D(params.sum)){
					_A( sum_root,"span",{"class":"float_left drill_btn dr_" + params.sum }, [	
							_HS( _C("span"), "filters." + params.sum ), 
							_C("span",{"class":"full_height"})
					]).onclick=function(){
						PgNav.chgParams({},["sum"],true	);
					};
					_A(sum_root, Drill.renderSummary(params) );
				}else{
					Drill.renderButtons(sum_root, params);
				}
			}
		);
	},
	renderButtons:function(root, params){
		params = params || {};
		Enum( KUI.fids, function(dkey,f){
			switch(f){
				case "ci":if(!_D(params.st)){return;}
				case "st":if(!_D(params.c)){return;}
					break;
				case "po":
				case "dt":
					if(params.g==="0"){return;}
			}
			if(!_D(params[f]) ){
				_A(root,"span",{"class":"drill_btn dr_" + f },[	
					_HS( _C("span"), "filters." + f ), 
					_C("span",{"class":"full_height"})
				]).onclick=function(){
					PgNav.chgParams({pg:"drill", sum:f},[],true	);
				};
			}
		});
	},
	renderSummary:function(){
		var root = _C("div",{"class":"inline_block"});
		var tbl = DU.createTable({},[{"class":"sum_group_name"},{"class":"sum_mem_count"},{"class":"sum_mem_percent"}],0);
		var pr = _A( root, KUI.getProgress(),{}, undefined, true );
		var sum = _P("sum");
		var spr = false;
		if( U.arrFind(["ag","ht","wt"], sum) ){
			spr="5";
		}

		var params = PgNav.searchParams({spr:spr});
		delete params[sum];

		Http.getCGI( gCGI.summary,
			params,
			function(response){
				_R(pr);
				var results = JSN(response);
				var total = _N(results.total_members);
				Enum( results.child_list, function(item){
					var cols = tbl.appendRow();
					//_A( cols[0], _TXT( KUI.filterText(sum, item.group_name, item) ) );
					KUI.setAttrText({el:cols[0], param:sum, data:item, dkey:"group_name"});
					_A( cols[1], _TXT( item.members_count ) );
					_A( cols[2], _TXT( "(" + ( Math.floor(_N(item.members_count)*1000/total)/10 ).toString() + "%)" ) );
					var add={};add[sum]=item.group_name;
					cols[0].onclick=function(){ PgNav.open("drill",add,["sum"]); };
					cols[2].onclick = cols[1].onclick=function(){ PgNav.open("list",add,["sum","p"]); };
				});
				_A(root,tbl.table);
			}
		);
		return root;
	}

};