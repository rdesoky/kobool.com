var UpdatePics = {
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}
		TopTabs.showTab("Menu.Update");
		TopTabs.select("Update.pics");

		var tt = _A( _CL("Contents"), "div", {"class":"pg_header title"}, _S("pics:pics.title") );

		var btn = _A( tt, "input", {type:"button", value:_P("wz") ? _S("a.show_my_page"):_S("pics:pics.finish"), "class":"float_right"} );
		
		var e = _A( "Contents", "div", {"class":"pg_body"} );

		
		btn.onclick=function(){
			PgNav.open( _P("wz") ? "mem":"update", {mem:false} );
		};
		var ctrl = _AD(e,{"class":"inline"});

		var b = _AD(ctrl,{"class":"bm_box"});
		_AD( b, {"class":"big_font"}, _S("pics:pics.visibility_title")  );
		_AD( b, {id:"PrivacyEditor"} );
		
		b = _AD(ctrl,{"class":"bm_box"});
		_AD( b, {"class":"big_font"}, _S("pics:pics.add_pic") );
		_AD( b, {id:"UploadPic"} );
		
		_HI( _AD( e, {id:"AlbumEditor"} ) );
		this.showUploader();
		this.showAlbum();
	},
	showPrivacyEditor:function(info){
		var tbl = DU.appendTable(_CL("PrivacyEditor"),{},[{},{id:"PrivacyHelp", "class":"box vtop text_view white_bg"}]);
		var fcol = tbl.cols[0];
		_H( "PrivacyHelp", _S("pics:pics.visibility_help.v" + info.visibility) );
		var opts = [];
		Enum([0,1,2,3,4], function(val){
			opts.push( 
				_A( 
					_A( fcol, new CCheckFrame().getDOM({"class":"radio_frame", tip:"pics:pics.visibility_help.v" + val } ) ), 
					[
						_C("input",{type:"radio", name:"pr", value:val}),
						_TXT( _S("pics:select_matched_pics_visibility.v"+val) )  
					]
				)[0] 
			);
		});
		opts[_N(info.visibility)].checked = true;
		
		Enum(opts, function(item, key){
			item.onclick = function(){
				Http.postCGI( gCGI.set_pic_visibility, {v: _EA(this,"value")}, function(t,x){
					var r = Http.xml2JS(x);
					_H("PrivacyHelp", _S("pics:pics.visibility_help.v" + r.visibility ) );
				});
			};
		});
		
	},
	uploadDone:function(response){
		switch( response.status ){
		case "ok_def":
			SSN.main_pic = _N(response.pid);
			_SA( "ProfilePic", {src:U.picSRC(SSN.main_pic, SSN.gender, true)} );
		case "ok":
			this.showAlbum();
			break;
		default:
			alert(response.status);
		}
		document.forms.uploader.submt.disabled = false;
	},
	showUploader:function(){
		var root = _CL("UploadPic");
		var frm = _A( root, "form", {
			"class":"clear_left",
			name:"uploader",
			enctype: "multipart/form-data", 
			encoding: "multipart/form-data"
		});

		frm.onsubmit=function(){
			var form = document.forms.uploader;
			form.submt.disabled = true;
			Http.postUpload( Http.cgiBase + "upload_pic.pl", new FormData(form), function(response){
				UpdatePics.uploadDone(response);
			}, function(){
				alert(_S("a.error"));
				form.submt.disabled = false;
			});
			return false;
		};
	
		_A( frm, "input", {type:"file", name:"filename"} ).onchange=function(){
			document.forms.uploader.submt.disabled = false;
		};
		_A( frm, "input", {type:"submit", name:"submt", value:_S("pics:pics.upload"), disabled:"true"} );
	},
	showAlbum:function(){
		var root = _CL("AlbumEditor");
		_A( root, "div", {"class":"big_font"}, _S("pics:pics.update_pics") + ":" );
		var tn_frame = _A( root, "div", {"class":"tn_frame"} );
		var tbar = _A( root, "div", {id:"PicToolbar"} );
		var pic_frame = _A(root, "div");
		var sel = new CSelector();
		Http.post({
			scr: gCGI.pics,
			data: {id:_N(_GC("id"))},
			onload: function(t,x){
				_H("Debug",t);
				// var r = Http.xml2JS(x);
				var r = JSON.parse(t);
				var prvEditor = _E("PrivacyEditor");
				if(!prvEditor.firstChild){
					UpdatePics.showPrivacyEditor(r);
				}
				
				( r.child_list && r.child_list.length )?_SH("AlbumEditor"):_HI("AlbumEditor");
				
				Enum(r.child_list, function(item){
					var tn = _A( tn_frame,"img",{"class":"tn_frame_pic", src:U.picSRC(item.id,SSN.gender,true)});
					tn.onclick=function(e){
						sel.select(this);
						_CL(tbar);
	
						if(this!=tn_frame.firstChild){
							_A( tbar, "span", {"class":"icon16 icon16-top",tip:"help:pics.move_top"} ).onclick=function(e){
								Http.postCGI( gCGI.set_top_pic, {id: item.id}, function(){
									UpdatePics.showAlbum();
								});
							};
						}
						
						if( _N(item.active)!=5 && _N(item.active)!=1 ){
							var btn = _A( tbar, "span", {"class":"icon16 icon16-profile"} );
							var initBtn;
							var toggleMainPic = function(){
								var pic_id = (item.id==SSN.main_pic?0:item.id);
								Http.postCGI( gCGI.set_main_pic,
									{ id:SSN.id, pid: pic_id },
									function(t,x){
										SSN.main_pic=pic_id;
										_SA( "ProfilePic", {src:U.picSRC(pic_id, SSN.gender, true)} );
										initBtn();
									}
								);
							};
							initBtn = function(){
								_SA( btn, {"tip":"help:pics." + ((item.id==SSN.main_pic)?"cancel_main":"set_main") });
								btn.onclick=function(){toggleMainPic();};
							};
							initBtn();
						}
						
						_A( tbar, "span", {"class":"icon16 icon16-delete",tip:"help:pics.delete"} ).onclick=function(e){
							Req("popup", function(){
								Popup.open("confirm",undef,"pics:pics.confirm_delete",[
									{
										title:_S("a.yes"),
										onclick:function(){
											Http.postCGI(gCGI.del_pic,
												{id:item.id},
												function(res){
													if(item.id==SSN.main_pic){
														IMem.refreshHeader(true);
													}
													UpdatePics.showAlbum();
												}
											);
										}
									},
									{
										title:_S("a.no"),
										focus:true
									}
								]);
							});
						};
						
						var ps={"0":"under_review", "1":"rejected", "5":"cant_be_main"}[item.active];
						if(ps){
							_HS( _A( tbar,"span",{"class":"vtop small"} ), "help:pics." + ps );
						}
	
						var pr = _A( _CL(pic_frame), KUI.getProgress() );
	
						_A( pic_frame, "img",{"class":"mem_pic", "src": U.picSRC(item.id,SSN.gender)} ).onload=function(){
							_R(pr);
						};
					};
				});

				if( tn_frame.firstChild ){
					tn_frame.firstChild.onclick();
				};
			}
		});
	}
};