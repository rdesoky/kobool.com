var CPoints = {
	renderEulaCheckLine:function(root, page_name){
		var eulaLine = _A( root, (new CCheckFrame()).getDOM() );
		var eulaChk = _A( eulaLine, "input", {type:"checkbox",name:"eula_ok", id:"eula_check", checked:_N(_P("accept"))?true:false});
		var el = _A( eulaLine, "span" );
		RS("cpoints:ui", function(){
			var str = _S("cpoints:ui.eula_accepted");
			el.innerHTML = str.replace("href1", "class='href' onclick=\"PgNav.open('cp_eula',{back:'"+page_name+"'});DU.cancelBubble(event);\"");
		});
		return {line:eulaLine, check:eulaChk};
	},
	renderLayout:function(p){
		r = _E(p.root);

		_HS( _A( r,"div",{"class":"pg_header title"} ), p.title );

		var tbl = _AT( "Contents", {"class":"contents_tbl",border:0}, [
			{"class":"left_side padding"},
			{"class":"wide_padding", width: p.bodyWidth || 520},
			{"class":"padding right_align"}
		]);

		var lside = tbl.cols[0];
		var body = tbl.cols[1];
		var rside = tbl.cols[2];

		_A( lside,"div",{"class":p.logo});

		CPoints.renderViewer({
			root:_A(lside,"div",{"class":"hidden"}), 
			memid:_P("mem")||SSN.id||"",
			onfinish:p.onfinish
		});

		if(p.page){
			_HS( _A( rside,"div", {"class":"center_align"} ), "cpoints:ui.other_methods" );
			CPoints.renderMethods({root:rside,exclude:[p.page]});
		}else{
			_R(rside);
		}
		return body;

	},
	renderMethods:function(p){
		var root = p.root || _C("div");
		Enum(["phone_tr"],
			function(item){
				if(!U.arrFind(p.exclude,item) ){
					_A( root, "li", {"class":"drill_btn payment_btn btn_" + item}, [
						_HS( _C("span"), "cpoints:methods." + item ), 
						_C("span",{"class":"full_height"})
					]).onclick = function(){
						PgNav.open( item );
					};
				}
			}
		);
		return root;
	},

	renderViewer:function( p ){
		_HS( _AD( p.root ), "cpoints:ui.for_member" );

		var txt = _A( _A( p.root, "div", {id:"TargetMemberNum", "class":"parag"} ), 
								"input", 
								{ type:"text", style:"width:116px", "class":"", value:p.memid } 
		);
		
		var viewer = _A( p.root, "div", {id:"TargetMemberView"});

		txt.onblur = function(e){
			CPoints.viewMember( {root:viewer, memid:txt.value, alert:true } );
		};

		if(_N(p.memid)){
			this.viewMember( {root:viewer, memid:p.memid, onfinish:p.onfinish } );
		}
	},

	viewMember:function( p ){
		_A( _CL(p.root), KUI.getProgress() );
		Http.getCGI( gCGI.member, {mem:p.memid}, function(res){
			_CL(p.root);
			
			var r = JSN(res);
			if(_N(r.success)){
				var m = r;
				CPoints.memInfo = m;

				RSCR("MemVUR.vw25",function(){
					_A(p.root,MemVUR.vw25.render(m));
				},{silent:1});

				//_A( p.root, "div", {id:"TargetMemberLoginID", "class":"href"}, m.login_id ).onclick=function(){
				//	PgNav.open("mem", {mem:m.id});
				//};
				if(p.onfinish){
					p.onfinish(m);
				}
			}else{
				CPoints.memInfo = null;
				if( p.alert ){
					KUI.msgbox({ msg:"errors:error." + r.error });
				}
			}
		} );
	}
};

var CPointsBuy = {
	onload:function(){
		TopTabs.showTab("Menu.CPoints");
		TopTabs.select("CP.buy");

		var root = CPoints.renderLayout( {root:"Contents", title:"cpoints:methods.page_title", bodyWidth:740} );
		var lst = _A(root, "ol", {id:"PaymentMethods"});
		CPoints.renderMethods( {root:lst} );
	}
};


var CPointsEULA = {
	onload:function(){
		TopTabs.showTab("Menu.CPoints");
		TopTabs.select("CP.eula");
		_HS( _A( "Contents","div",{"class":"pg_header title"} ), "cpoints:eula.title" );
		var txt = _A( "Contents","div",{id:"CPiontsEUALText", "class":"pg_body text_view"} );
		_HS( _A(txt,"div",{}, KUI.getProgress()), "cpoints:eula.contents" );
		var back = _P("back");
		if(back){
			var ln = _A(txt,"center");
			_A( ln, "input", {type:"button", value: _S("cpoints:ui.accept")} ).onclick=function(){
				PgNav.open(back,{accept:1});
			};
			_A( ln, "input", {type:"button", value: _S("cpoints:ui.back")} ).onclick=function(){
				PgNav.open(back,undef,["accept"]);
			};
		}
	}
};

var CPointsHelp = {
	onload:function(){
		TopTabs.showTab("Menu.CPoints");
		TopTabs.select("CP.help");
		_HS( _A("Contents","div",{"class":"pg_header title"} ) , "cpoints:qa.title" );
		_HS( _A("Contents","div",{id:"CPiontsEUALText","class":"pg_body text_view"}, 
				KUI.getProgress()
			), 
			"cpoints:qa.contents" 
		);
	}
};
