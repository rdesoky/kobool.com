/**
 * Created by rdeso_000 on 1/7/2015.
 */
define(["jquery","dom-utils","http", "kui"],function($, $du, http, kui){
	var module;
	return  module = {
		initFeedback:function(dom, record){
			$(".save",dom).click(function(e){
				var editor = dom.querySelector("textarea");
				if( editor.value == record.feedback ){
					$du.removeClass(dom, "editing");
					return;
				}
				var el = e.target;
				var pr = $du.replace(el, kui.getProgress());
				http.post({
					scr:http.api.upd_feedback,
					silent:1,
					data:{id:record.id, text:editor.value}
				}).done(function(res){
					$du.replace(pr, el);
					record.feedback=editor.value;
					record.feedback_date = "";
					$du.removeClass(dom, "editing");
				});
			});

			module.init(dom);

		},
		initAnswer:function(dom, record){
			module.init(dom);
			$(".save",dom).click(function(e){
				var editor = dom.querySelector("textarea");
				if( editor.value == record.answer_text ){
					$du.removeClass(dom, "editing");
					return;
				}
				var el = e.target;
				var pr = $du.replace(el, kui.getProgress());
				http.post({
					scr:http.api.post_answer,
					silent:1,
					data:{qid:record.question, answer:editor.value}
				}).done(function(res){
					$du.replace(pr, el);
					$du.removeClass(dom, "editing");
					$(".i-text-frame", dom).addClass("und_review");
				});
			});
		},
		init:function(dom){
			var orgText, $textArea = $("textarea",dom);

			function updateTextAreaHeight(el){
				el.style.height = "auto";
				var newHeight = el.scrollHeight;
				if(newHeight){
					el.style.height = newHeight.toString() + "px";// padding is included
				}else{
					setTimeout(function(){
						updateTextAreaHeight(el);
					},500)
				}
			}

			$textArea.bind( "click change keyup cut paste input blur", function(e){
				updateTextAreaHeight(e.target);
			});

			$textArea.bind( "focus", function(e){
				if (orgText===undefined){
					orgText = $textArea.dom().value;
				}
				$du.addClass(dom, "editing");
			});

			$textArea.bind( "blur", function(e){
				if(orgText == $textArea.dom().value) {
					$du.removeClass(dom, "editing");
				}else{
					//TODO: set dirty flag to prevent navigation without saving
				}
			});

			$(".cancel",dom).bind( "click", function(e){
				$textArea.dom().value = orgText;
				$du.removeClass(dom, "editing");
			});

			$(".save",dom).click(function(e){
				orgText = $textArea.dom().value;
			});

			setTimeout(function(){// adjust initial height to show all text
				updateTextAreaHeight(dom.querySelector("textarea"))
			},100);

		}
		//drawBtn:function( vwr, info ){
		//	if(!kui.opGender(info)){
		//		return undefined;
		//	}
		//	var el = _C("span", {'class':"btn edit_icon", tip:"help:personal_note.btn_tip"});
		//	el.onclick=function(){
		//		feedback.onEdit( vwr, info );
		//	};
		//	return el;
		//},
		//onDelete:function(r, info){
		//	kui.confirm( "a.sure", function(){
		//		http.postUpdate(
		//			gCGI.upd_feedback,
		//			{id:info.id, text:""},
		//			function(res){
		//				delete info.feedback;
		//				delete info.feedback_date;
		//				feedback.update(r,info);
		//			}
		//		);
		//	});
		//},
		//onEdit:function(r, info){
		//	if(!kui.chkLogin()){
		//		return;
		//	}
		//	require(["popup"], function(popup){
		//		var editor = _C("textarea",undefined, info.feedback || "");
		//		var title = _HS(_C("span"), "help:personal_note.popup_title", function(s){
		//			return s.replace("%m%", info.login_id);
		//		});
		//		popup.open("FeedbackEditor", title, editor,[
		//			{
		//				title:_S("a.save"),
		//				onclick:function(){
		//					r.style.display = "block";
		//					var pr = $du.replace(r, kui.getProgress());
		//					http.post({
		//						scr:gCGI.upd_feedback,
		//						silent:1,
		//						data:{id:info.id, text:editor.value},
		//						onload:function(res){
		//							$du.replace(pr, r);
		//							info.feedback=editor.value;
		//							info.feedback_date = "";
		//							feedback.update(r,info);
		//						}
		//					});
		//				}
		//			},
		//			{
		//				title:_S("a.cancel")
		//			}
		//		]);
		//		editor.focus();
		//	});
		//
		//},
		//draw:function(info){
		//	var r = _C( "div" );
		//	this.update(r, info);
		//	return r;
		//},
		//update:function(r, info){
		//	_CL(r);
		//	$du.removeClass(r, "feedback");
		//	$du.addClass(r, "hidden");
		//	if( info.feedback ){
		//		$du.addClass(r, "feedback");
		//		$du.removeClass(r, "hidden");
		//		_A( r,"div", {}, info.feedback.replace(/\n/g,"<br/>") );
		//		var tbar = _A( r,"div", {"class":"tmargin small footer_bar"} );
		//
		//		if(info.feedback_date){
		//			_A( tbar, "span", {"class":"item_date"}, info.feedback_date );
		//		}
		//
		//		_HSEP(tbar);
		//		_HS( _A( tbar, "a", {href:"#"} ), "sbtn.edit" ).onclick=function(){
		//			feedback.onEdit(r, info);
		//			return false;
		//		};
		//		_HSEP(tbar);
		//		_HS( _A( tbar, "a", {href:"#"} ), "sbtn.delete" ).onclick=function(){
		//			feedback.onDelete(r, info);
		//			return false;
		//		};
		//	}
		//}
	};
});
