var My={
	onchange:function(){
		this.renderBody({r:"MyContents"});
		PgNav.scrollTop();
	},
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}

		TopTabs.showTab("Menu.Search");
		TopTabs.select("HeaderLogo");

		var tbl = _AT( 
			_CL("Contents"), 
			{"class":"contents_tbl full_width", border:0 }, 
			[
				{"class":"left_side"},
				{"class":"pg_body", width:540},
				{"class":"right_align"}
			] 
		);

		My.sideSelector = new CSelector();
		_A( tbl.cols[0], this.renderSideSelectors() );

		_A( tbl.cols[0], this.renderStats() );

		_A( tbl.cols[1],"div", {id:"PageTitle", "class":"big_title"} );
		_A( tbl.cols[1],"div", {id:"MyContents"} );
		
		var sideLists = [	
			{	r: tbl.cols[2] ,title:"search_lists.wsr", params:{ls:"wsr",ob:"ra",ps:4} },
			{	r: tbl.cols[0] ,title:"search_lists.wls" ,params:{ls:"wls",ob:"ra",ps:4} },
			{	r: tbl.cols[2] ,title:"search_lists.vtr" ,params:{ls:"vtr",ob:"rv",ps:4} },
			{	r: tbl.cols[2] ,title:"search_lists.nvr" ,params:{ls:"nvr",ob:"rv",ps:4} },
			{	r: tbl.cols[0] ,title:"search_lists.vtd" ,params:{ls:"vtd",ob:"rv",ps:4} },
			{	r: tbl.cols[2] ,title:"search_lists.bkm" ,params:{ls:"bkm",ob:"rl",ps:6} }
		];
		
		var renderSideLists = function(ndx){
			if(ndx<sideLists.length){
				My.renderSnapshot(
					sideLists[ndx],
					function(){
						renderSideLists(ndx+1);
					}
				);
			}
		};
		
		this.renderBody({r:"MyContents", onfinish:function(){
			renderSideLists(0);
		}});
	},

	renderBody:function(p){
		var spg = _P("spg",_GC("hspg","srch"));
		My.sideSelector.select(_E("Select_"+spg));
		_SC("hspg",spg);
		switch(spg){
		case "newq":
			break;
		case "srch":
			_HS("PageTitle","m.qsearch");
			RSCR("SavedSearch", function(){
				_A(_CL(p.r), SavedSearch.render(function(res){
					My.renderSnapshot({
							r:p.r, 
							title:"a.browse", 
							params:PgNav.query2Hash( res.child_list[0].query,{ps:16} )
							
						},
						p.onfinish
					);
				}));
			},{silent:1});
			break;
		case "ntfy":
			_HS("PageTitle","m.notifications");
			_A(_CL(p.r),"div",{"class":"title"},_S("a.not_implemented"));;
			break;
			break;
		case "news":
			_HS("PageTitle","m.news_feed");
			_A(_CL(p.r),"div",{"class":"title"},_S("a.not_implemented"));;
			break;
		case "qa":
			_HS("PageTitle","m.qa_feed");
			Req("qa", function(){
				var params = PgNav.paramsHash( {ps:10, g:SSN.gender, pg:false} );
				if(SSN.id){
					if(!params.ls){
						params.ls = _GC("qls","act");
					}else{
						_SC("qls",params.ls,true);
					}
				}else{
					params.ls = "act";
				}
				QA.renderList({
					root:_E(p.r),
					params:params,
					filterOn:true,
					onload:function(r){
						p.onfinish?p.onfinish():undef;
					}
				});
			});
		}
	},
	renderSnapshot:function(p, onload){
		var root = _A( p.r, this.create_side_frame(p));
		var pr = _A( root, KUI.getProgress() );
		Http.getCGI( gCGI.search, 
			U.clone(p.params,{noc:1,tn:1}),
			function(response){
				_R(pr);//remove progress
				var results=JSN(response);
				if(results.error){
					_HS(root,"errors:error." + results.error);
				}else{
					if(_N(results.count)){
						Enum( results.child_list, function(child){
							_A(root, "div",{"class":"inline vtop"},My.renderSnapshotItem(child,p.params));
						});
					}else{
						_A(root, "center",{"class":"light_txt"},_S("a.no_results"));
					}
				}
				if(onload){
					onload(results);
				}
			}
		);	
	},
	renderSnapshotItem:function(inf, params){
		var mpanel = _C("div", {"class":"mem_thumb", tipw:260});
		mpanel.ontooltip=function(){
			var tt = _C("div",{style:"min-width:260px;min-height:120px;"});
			RSCR("MemVUR.vw10",function(){
				_A(tt,MemVUR.vw10.render(inf));
			},{silent:1});
			return tt;
		};
		mpanel.onclick=function(){
			if(!_N(inf.id)){
				return;
			}else if(_N(inf.activated)){
				PgNav.open("mem", U.clone(params,{mem:inf.id}), ["ps","mtab","ap","rap","myap"]);
			}else{
				KUI.msgbox({msg:"a.inactive"});
			}
		};
		var pic_frame = _A(mpanel,"div",{"class":"gallery_pic float_left"});
		var img = _A( pic_frame,"img",{src:U.picSRC(inf.main_pic,inf.gender,true) } );
		U.disableSelection(img);
		if(	_N(inf.id) ){
			_A(mpanel,"div",{"class":"login_id"},inf.login_id);
			if( _N(inf.activated) ){
				RSCR("ERender",function(){
					ERender.drawPointsFlag( pic_frame, inf );
				},{silent:1});
				if(_D(inf.age)){_A(mpanel,"div",{"class":"attr"},inf.age + " " + _S("a.year"));}
				if(_D(inf.country)){
					_HS( _A(mpanel,"div",{"class":"attr"}),"geo:c.v"+inf.country );
				}
			}else{
				_A(mpanel,"div",{"class":"attr"},_S("a.inactive"));
			}
		}else{
			_A(mpanel,"div",{"class":"note"},_S("a.hidden_mem"));
		}
		return mpanel;
	},
	create_side_frame:function(p){
		var frame=_C("div",{"class":"left_align snapshot_frame"});
		_HS( _A( frame,"div",{"class":"href snapshot_title"} ), p.title ).onclick=function(){
			PgNav.open("list",p.params,["ps","p"]);
		};
		return frame;
	},

	renderSideSelectors:function(stats){
		var isel = _C("div", {"class":"side_selectors"});
		Enum({
				qsearch:{spg:"srch"}
				,qa_feed:{spg:"qa"}
				//,news_feed:{spg:"news"}
				//,notifications:{spg:"ntfy"}
			},
			function(item,key){
				var lnk = _A(isel, "div", {id:"Select_" + item.spg, "class":"href"});
				_HS( lnk, "m." + key ).onclick=function(){
					PgNav.chgParams({spg:item.spg});
					My.sideSelector.select(lnk);
				};
			}
		);
		return isel;
	},
	renderStats:function(){
		var stats = _C("div", {"class":"side_selectors"});

		Enum({	questions:{ pg:"mem",params:{mem:false, mtab:"TNewQ"} }
				,visitors:{ pg:"list",params:{ls:"vtr",ob:"rv"} }
				,wishers:{ pg:"list",params:{ls:"wsr",ob:"ra"}, tip:"help:tips.wishers" }
				,declines:{ pg:"declines",params:{} }
			},
			function(item, key){
				if( SSN[key] ){
					_A( stats, "div", {"class":"href", tip:item.tip} , U.brackets( SSN[key], _S("m."+key) ) ).onclick=function(){
						PgNav.open( item.pg, item.params, true );
					};
				}
		});

		return stats;
	}
};