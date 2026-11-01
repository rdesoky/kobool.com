/**
 * Created by rdeso_000 on 1/4/2015.
 */

define(["jquery","js-promise"],function($,CPromise){
	var events = {};
	var module;
	return module = {
		fire:function(eID, info	, target){
			//console.log({msg:"fire_event",eID:eID, info:info});
			Log({msg:"fire_event",eID:eID, info:info}, Log.type.info);
			setTimeout( function(){
					$.each( events[eID],
						function(item){
							if(!_D(target) || (target==item.target) ){
								item.handler.call(item.listener||window, info);
							}
						}
					);
				},
				1
			);
		},
		on:function(){
			return this.listen.apply(this, arguments);
		},
		listen:function(eID, handler, listener, target){
			if(!_D(events[eID])){
				events[eID]=[];
			}
			events[eID].push({
					"handler":handler,
					"listener":listener,
					"target":target
				}
			);
		},
		removeListener:function(eID, listener){
			for(var i=0,len=events[eID].length;i<len;i++){
				var item = events[eID][i];
				if(item.listener===listener){
					events[eID].splice(i,1);
					if(!events[eID].length){
						delete events[eID];
					}
					break;
				}
			}
		},
		waitFor:function(eID){
			return new CPromise(function(onSuccess, onError){
				var listener = {};
				module.listen(eID,function(){
					onSuccess();
					module.removeListener(eID, listener);
				},listener)
			});
		}
	};

});