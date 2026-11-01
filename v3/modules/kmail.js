define([],function(){
	var module;

	return module = {
		mainTags:{
			inbox:{spg:"inbox",tags:1},
			alerts:{spg:"alerts",tags:2},
			sent:{spg:"sent",tags:3},
			starred:{spg:"starred",tags:4},
			saved:{spg:"saved",tags:5},
			trash:{spg:"trash",tags:6}
		},
		onload:function(){
			if( !KUI.chkLogin({nav:true}) ){
				return;
			}

			TopTabs.showTab("Menu.Mailbox");

			this.renderUI( { r: _E("Contents"), owner:_GC("id") });
			this.onchange();
		},
		renderUI:function(p){
			if(!this.DViewer){
				var cMailDV = {
					onclick:function(row, cinfo){
						this.selectRow(row.id);
						//PgNav.open("kmail",{msgid:row.id},undef, true);
						PgNav.chgParams({msgid:row.id},undefined,false, true);
					},
					rowClass:function(row){
						if( !row.time_read ){
							return "new";
						}
						return undefined;
					},
					col:{
						id:{fld:"id", width:17,
							render:function(row){
								var starred = U.arrFind(row.tags.split(","),"4");
								var icn = _C( "span", {"class":"flat_btn " + (starred? "fav_on":"fav_off") } );
								icn.onclick=function(e){
									DU.cancelBubble(e);
									var q = {msgid:row.id};
									if(starred){
										q.deltags="4";
										starred=false;
									}else{
										q.addtags="4";
										starred=true;
									}
									icn.className = "flat_btn progress16";
									Http.post({
										silent:1,
										refresh:1,
										scr:"email_update_msg.pl",
										data:q,
										onload: function(){
											icn.className="flat_btn " + (starred? "fav_on":"fav_off");
										}
									});
								};
								return icn;
							}
						},
						from:{
							fld:"msg_from",
							title: _HS(_C("span"),"kmail:ui.msg_from"),
							width:180,
							render:function(row){
								return _TXT( _S("kmail:ui.admin") );
							}
						},
						title:{
							fld:"title",
							title: _HS(_C("span"),"kmail:ui.subject"),
							width:300
						},
						time_created:{
							fld:"time_created",
							title: _HS(_C("span"),"kmail:ui.msg_date"),
							width:150
						}
					},
					pageSize:5
				};
				this.DViewer = new CDataViewer(cMailDV);
				KEvents.listen("refreshData", this.refreshData, this);
			}
			var tbl = _AT(
				_CL( p.r || "Contents" ),
				{"class":"contents_tbl", border:0 },
				[
					{"class":"left_side"},
					{},
				]
			);

			this.sideSelector = new CSelector();
			_HS( _A( tbl.cols[0], "div", {"class":"pg_header title"} ), "kmail:ui.page_title" );
			_A( tbl.cols[0], this.renderSideSelectors() );
			_A( tbl.cols[1],"div", {id:"PageTitle", "class":"title padding"} );
			var cnt = _A( tbl.cols[1],"div", {id:"KMailContents"} );
			_A( _A(cnt,"div",{"class":"section"}), this.DViewer.render() );
			_A( cnt, "div", {id:"KMailMsg", "class":"section"} );

		},
		refreshData:function(){
			if(this.DViewer){
				this.DViewer.refresh();
			}
		},
		onchange:function(){
			if( _D(TopTabs) ){
				TopTabs.select("Mailbox." + _P("spg","inbox"));
			}
			this.renderBody({ r:"KMailContents" });
		},

		renderSideSelectors:function(){
			var isel = _C("div", {"class":"side_selectors"});
			Enum( this.mainTags ,
				function(item,key){
					var lnk = _A(isel, "div", {id:"Select_" + item.spg, "class":"href"});
					_HS( lnk, "kmail:tags." + key ).onclick=function(){
						PgNav.chgParams({spg:item.spg, tags:item.tags, msgid:false});
						module.sideSelector.select(lnk);
					};
				}
			);
			return isel;
		},
		renderBody:function( p ){
			var spg = _P("spg","inbox");
			this.sideSelector.select(_E("Select_"+spg));

			_HS("PageTitle","kmail:tags." + spg);

			var q = { tags:_P("tags",1), lang:U.lang(), ps:5 };
			U.extend(q, p.q);
			this.DViewer.setQuery(q , "email_get_list.pl" );

			var msgID = _N(_P("msgid",0));
			if( msgID ){
				this.DViewer.selectRow(msgID);
				var pr = _R( KUI.blockedEl("KMailMsgRoot") );//capture blocked old results
				_A( _CL("KMailMsg"), "div", {}, pr );
				Http.getCGI(gCGI.email_get_msg, {msgid:msgID,lang:U.lang()}, function(res){
					var r = JSN(res);
					if(r.child_list&&r.child_list.length){
						_A( _CL("KMailMsg"), module.renderMsg(r.child_list[0]) );
					}else{
						_CL("KMailMsg");
					}
				});
			}else{
				this.DViewer.selectRow(0);
				_HS( _A(_CL("KMailMsg"),"div",{"class":"text_view light_txt"}),"kmail:ui.no_selection");
			}

		},
		renderMsg:function(info){
			var root = _C( "div", {id:"KMailMsgRoot"} );
			var hdr = _A(root, "div", {"class":"pg_header"} );
			var tbl = _AT( hdr, {"class":"full_width"}, [{"class":"full_width"},{"class":"vbottom"}] );
			_A( tbl.cols[0], "div", {"class":"title"}, info.title );

			_A( _A(tbl.cols[0],"div",{"class":"nowrap"}), [
				_HS(_C("span"), "kmail:ui.msg_from"),
				_TXT(": "),
				_C("span", {"class":"bold"}, _S("kmail:ui.admin") )
			]);

			var abar = _A(tbl.cols[1],"div",{"class":"nowrap"} );

			_A( _A(tbl.cols[1],"div",{"class":"nowrap"}), [
				_HS(_C("span"), "kmail:ui.msg_date"),
				_TXT(": "),
				_C("span", {"class":"bold"}, info.time_created )
			]);

			_HS( _A(abar, "span", {"class":"button"}), "kmail:ui.delete" ).onclick = function(){
				if(_P("spg")=="trash"){
					KUI.confirm("a.sure", function(){
						Http.postUpdate(
							"email_update_msg.pl",{
								msgid:info.id
								,del:"1" //trash
							}, function(){
								module.DViewer.render(true);
								_CL("KMailMsgRoot");
							}
						);
					});
				}else{//move to trash
					Http.postUpdate(
						"email_update_msg.pl",{
							msgid:info.id
							,addtags:"6" //trash
							,deltags:"1,2,3,4,5"// all but trash
						}, function(){
							module.DViewer.render(true);
							_CL("KMailMsgRoot");
						}
					);
				}
			};


			_HSEP(abar);

			var moveList = _A(abar, "select", {});

			_HS( _A(moveList,"option",{value:"0"}), "kmail:ui.move_to" );

			Enum( this.mainTags, function(val, key){
				if( val.tags != 4 && !U.arrFind(info.tags.split(","), val.tags ) ) {
					_HS( _A(moveList,"option",{value:val.tags}), "kmail:tags." + key );
				}
			});

			moveList.onchange = function(){
				if( _N(this.value) ){
					Http.postUpdate(
						"email_update_msg.pl",{
							msgid:info.id
							,addtags:this.value
							,deltags:"1,2,3,5,6" //all but starred
						},
						function(){
							module.DViewer.render(true);
							_CL("KMailMsgRoot");
						}
					);
				}
			};
			_A( root, "div", {"class":"wide_padding"}, info.body );
			return root;
		}
	};
});
