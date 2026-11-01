/**
 * Created by rdeso_000 on 1/7/2015.
 */
define([], function(){
	return function( classDef, baseClass ) {
		var classConstructor = function () {

			if (baseClass) {
				baseClass.apply(this, arguments);
			}

			//for( var item in classDef ){// copy elements from passed classDef
			//	this[item] = classDef[item];
			//}

			this.destruct = function () {
				var chain = [];

				for (var currConst = classConstructor; currConst; currConst = currConst.baseClass) {
					if (currConst.classDef && currConst.classDef.destroy) {
						chain.push(currConst);
					}
				}

				for (var i = chain.length - 1; i >= 0; i--) {
					var classDef = chain[i].classDef;
					if (classDef.destroy) {
						classDef.destroy.apply(this);
					}
				}
			};
			this.extend = function (def) {
				for (var item in def) {
					this[item] = def[item];
				}
			};

			this.extend(classDef);

			this.getDOM = function (attr) {
				return this.dom || this.render(attr);
			};

			if (this["init"] != undefined) {
				this.init.apply(this, arguments);
			}
		};

		classConstructor.classDef = classDef;
		classConstructor.baseClass = baseClass;

		return classConstructor;
	};
});
