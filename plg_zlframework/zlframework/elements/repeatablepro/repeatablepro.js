(function(b){var d=function(){};b.extend(d.prototype,{name:"ElementRepeatablePro",options:{msgDeleteElement:"Delete Element",msgSortElement:"Sort Element",msgLimitReached:"Limit reached",instanceLimit:"",url:""},initialize:function(c,d){this.options=b.extend({},this.options,d);var a=this,e=c.find("ul.repeatable-list"),h=e.find("li.hidden").remove(),g=e.find("li.repeatable-element").length;a.options.msgAddInstance=c.find("p.add a").html();e.find("li.repeatable-element").each(function(){a.attachButtons(b(this))}); e.delegate("span.sort","mousedown",function(){e.find(".more-options.show-advanced").removeClass("show-advanced");e.height(e.height());b(this).closest("li.repeatable-element").find(".more-options").hide().end().find(".file-details").hide()}).delegate("span.sort","mouseup",function(){b(this).closest("li.repeatable-element").find(".more-options").show().end().find(".file-details").show()}).delegate("span.delete","click",function(){b(this).closest("li.repeatable-element").fadeOut(200,function(){b(this).remove(); a.options.instanceLimit&&c.find("p.add a").removeClass("disabled").html(a.options.msgAddInstance)})}).sortable({handle:"span.sort",placeholder:"repeatable-element dragging",axis:"y",opacity:1,delay:100,cursorAt:{top:16},tolerance:"pointer",containment:"parent",scroll:!1,start:function(b,a){a.item.addClass("ghost");a.placeholder.height(a.item.height()-2);a.placeholder.width(a.item.find("div.repeatable-content").width()-2)},stop:function(a,c){c.item.removeClass("ghost");c.item.find(".more-options").show(); c.item.find(".file-details").show();e.height("");b(a.target).find(".repeatable-element").each(function(a){b(this).find("input, textarea").each(function(){var c=b(this).attr("name").replace(/(elements\[\S+])\[(-?\d+)\]/g,"$1["+a+"]");b(this).attr("name",c)})})}});c.find("p.add a").on("click",function(){if(a.options.instanceLimit&&a.options.instanceLimit<=e.children().length)return!1;a.addElement(e,h.html().replace(/(elements\[\S+])\[(-?\d+)\]/g,"$1["+g++ +"]"));a.options.instanceLimit&&a.options.instanceLimit<= e.children().length&&c.find("p.add a").addClass("disabled").html(a.options.msgLimitReached)});c.find(".btn-group.ajax-add-instance .dropdown-menu a").on("click",function(){var c=b(this),d=c.closest(".btn-group").find(".btn.dropdown-toggle").addClass("btn-working"),f=c.data("layout");b.ajax({url:a.options.url+"&task=callelement",type:"GET",data:{method:"loadeditlayout",layout:f},success:function(b){a.addElement(e,b.replace(/(elements\[\S+])\[(-?\d+)\]/g,"$1["+g++ +"]"));d.removeClass("btn-working"); c.trigger("newinstance")}})})},addElement:function(c,d){var a=b('<li class="repeatable-element" />').html(d);this.attachButtons(a);a.find("input, textarea").filter(function(){return"hidden"!=b(this).attr("type")}).each(function(){b(this).val("").html("")});a.appendTo(c);a.children("div.repeatable-content").effect("highlight",{},1E3)},attachButtons:function(c){c.children().wrapAll(b("<div>").addClass("repeatable-content"));b("<span>").addClass("sort").attr("title",this.options.msgSortElement).appendTo(c); b("<span>").addClass("delete").attr("title",this.options.msgDeleteElement).appendTo(c)}});b.fn[d.prototype.name]=function(){var c=arguments,f=c[0]?c[0]:null;return this.each(function(){var a=b(this);if(d.prototype[f]&&a.data(d.prototype.name)&&"initialize"!=f)a.data(d.prototype.name)[f].apply(a.data(d.prototype.name),Array.prototype.slice.call(c,1));else if(!f||b.isPlainObject(f)){var e=new d;d.prototype.initialize&&e.initialize.apply(e,b.merge([a],c));a.data(d.prototype.name,e)}else b.error("Method "+ f+" does not exist on jQuery."+d.name)})}})(jQuery);