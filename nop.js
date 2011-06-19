var nop = nop || {};

// ----------------------------------------------------------------------------------------------------------------- //

nop.inherit = function(class_, base) {
    var F = function() {};
    F.prototype = base.prototype;
    class_.prototype = new F();
    class_.prototype.constructor = class_;
};

