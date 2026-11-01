var KActions = {//TODO: move it to separate file
	onclickBlock:function(info, btn,onfinish){
		if(!KUI.chkLogin()){return;}
		DU.addClass(btn,"progress16");
		if(_N(info.blocked)){
			DU.removeClass(btn,"block_on");
			KActions.unblock(info, function(){
				DU.removeClass(btn,"progress16");
				DU.addClass(btn,"block_off");
				_SA(btn,{tip:"help:tips.block"});
				info.blocked = 0;
				if(onfinish){
					onfinish();
				}
			});
		}else{
			DU.removeClass(btn,"block_off");
			KActions.block(info, function(){
				DU.removeClass(btn,"progress16");
				DU.addClass(btn,"block_on");
				_SA(btn,{tip:"help:tips.unblock"});
				info.blocked = 1;
				if(onfinish){
					onfinish();
				}
			});
		}
	},
	onclickBookmark:function(info, btn){
		if(!KUI.chkLogin()){return;}
		DU.addClass(btn,"progress16");
		if(_N(info.bookmark)){
			DU.removeClass(btn,"fav_on");
			KActions.del_bookmark(info, function(){
				DU.removeClass(btn,"progress16");
				DU.addClass(btn,"fav_off");
				_SA(btn,{tip:"help:tips.bookmark"});
				info.bookmark = 0;
			});
		}else{
			DU.removeClass(btn,"fav_off");
			KActions.bookmark(info, function(){
				DU.removeClass(btn,"progress16");
				DU.addClass(btn,"fav_on");
				_SA(btn,{tip:"help:tips.unbookmark"});
				info.bookmark = 1;
			});
		}
	},
	block:function(info, onSuccess){
		if(KUI.chkLogin()){
			Http.post({
				refresh:1,
				silent:1,
				scr:"block.pl", 
				data:{id:info.id},
				onload:function(t,x){
					if(onSuccess){
						onSuccess();
					}
			}});
		}
	},
	unblock:function(info, onSuccess){
		if(KUI.chkLogin()){
			Http.post({
				refresh:1,
				silent:1,
				scr:"unblock.pl", 
				data:{id:info.id},
				onload:function(t,x){
					if(onSuccess){
						onSuccess();
					}
				}
			});
		}
	},
	bookmark:function(info, onSuccess){
		if( KUI.chkLogin() ){
			Http.post({
				refresh:1,
				silent:1,
				scr:"addbookmark.pl", 
				data:{id_watched:info.id},
				onload:function(t,x){
					if(onSuccess){
						onSuccess();
					}
				}
			});
		}
	},
	del_bookmark:function(info, onSuccess){
		if( KUI.chkLogin() ){
			Http.post({
				refresh:1,
				silent:1,
				scr:"delete_bookmark.pl", 
				data:{id:info.id},
				onload:function(t,x){
					if(onSuccess){
						onSuccess();
					}
			}});
		}
	}
};
