var nop = nop || {};

// ----------------------------------------------------------------------------------------------------------------- //
// nop.XML
// ----------------------------------------------------------------------------------------------------------------- //

/**
 * @constructor
 * @param {(String|Object|Document)=} o
 * @param {Function=} callback
 */
nop.XML = function(o, callback) {
    this._init(o, callback);
};

/**
 * @protected
 * @param {(String|Object|Document)=} o
 * @param {Function=} callback
 */
nop.XML.prototype._init = function(o, callback) {

    if (!o) { return; }

    switch (typeof o) {
        case 'string':
            if (/^</.test(o)) {
                this.parse(o);
            } else {
                this.load(o, callback);
            }
            break;
        case 'object':
            if (o.constructor === Object) {
                this.parse( nop.XML.json2xmlstr(o) );
            } else {
                this.set(o);
            }
    }

};

// ----------------------------------------------------------------------------------------------------------------- //

nop.XML.prototype.get = function() {
    return this._document;
};

nop.XML.prototype.set = function(doc) {
    return ( this._document = doc );
};

/**
 * @return {Node}
 */
nop.XML.prototype.root = function() {
    return this.get().documentElement;
};

// ----------------------------------------------------------------------------------------------------------------- //

if (document.implementation && document.implementation.createDocument) {

        /**
         * @private
         * @return {Document}
         */
        nop.XML.prototype._empty = function() {
            var doc = document.implementation.createDocument('', '', null);

            return this.set(doc);
        };

} else {

    /**
     * @private
     */
    nop.XML.prototype._pid = 'dom';

    /**
        @private
        @return {Document}
    */
    nop.XML.prototype._empty = function() {
        var doc = nop.XML._getDOM(this._pid);

        return this.set(doc);
    };

}

// ----------------------------------------------------------------------------------------------------------------- //

if (typeof DOMParser != 'undefined') {

    /** @private */ nop.XML._DOMParser = new DOMParser();

    nop.XML.prototype.parse = function(xml) {
        this.set( nop.XML._DOMParser.parseFromString(xml, 'text/xml') );
    };

} else {

    // http://blogs.msdn.com/b/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx

    /** @private */ nop.XML._pids = {
        dom: [
            "Msxml2.DOMDocument.6.0",
            "Msxml2.DOMDocument.3.0"
        ],
        threaded_dom: [
            "MSXML2.FreeThreadedDOMDocument.6.0",
            "MSXML2.FreeThreadedDOMDocument.3.0"
        ],
        xslt: [
            "Msxml2.XSLTemplate.6.0",
            "MSXML2.XSLTemplate.3.0"
        ]
    };

    /**
        @private
        @return {Document}
    */
    nop.XML._getDOM = function(id) {
        var pid = nop.XML._getDOM[id];
        if (!pid) {
            var pids = nop.XML._pids[id];
            for (var i = 0, l = pids.length; i < l; i++) {
                try {
                    pid = pids[i];
                    var dom = new ActiveXObject(pid);
                    nop.XML._getDOM[id] = pid;
                    return dom;
                } catch (e) {}
            }
            // FIXME: We have a problem.
        }
        return new ActiveXObject(pid);
    };

    nop.XML.prototype.parse = function(xml) {
        var doc = this.get() || this._empty();
        doc.loadXML(xml);
    };

}

// ----------------------------------------------------------------------------------------------------------------- //

/**
 * @param {String} url
 * @param {Function=} callback
 */
nop.XML.prototype.load = function(url, callback) {
    var that = this;

    $.ajax({
        url: url,
        dataType: 'xml',
        async: !!callback,
        success: function(data) {
            that.set( data );
            if (callback) {
                callback();
            }
        }
    });
};

// ----------------------------------------------------------------------------------------------------------------- //

if (typeof XMLSerializer != 'undefined') {

    /** @private */
    nop.XML._XMLSerializer = new XMLSerializer();

    /**
     * @param {Node} node
     * @return {String}
     */
    nop.XML.node2string = function(node) {
        return nop.XML._XMLSerializer.serializeToString(node);
    };

} else {

    /**
     * @param {Node} node
     * @return {String}
     */
    nop.XML.node2string = function(node) {
        return node.xml;
    };

}

/**
 * @return {String}
 */
nop.XML.prototype.toString = function() {
    return nop.XML.node2string( this.root() );
};

// ----------------------------------------------------------------------------------------------------------------- //

/**
 * @return {String}
 */
nop.XML.json2xmlstr = function(json, tag) {

    if (json === null || json === true) {
        return '<' + tag + '/>';
    }

    var start, end;
    if (tag) {
        start = '<' + tag + '>';
        end = '</' + tag + '>';
    } else {
        start = end = '';
    }

    if (typeof json != 'object') {
        return start + json + end;
    }

    var r = '';

    if (json instanceof Array) {
        for (var i = 0, l = json.length; i < l; i++) {
            r += start + nop.XML.json2xmlstr(json[i]) + end;
        };
        return r;
    }

    for (var name in json) {
        r += nop.XML.json2xmlstr(json[name], name);
    };
    return start + r + end;

};

// ----------------------------------------------------------------------------------------------------------------- //

if (typeof document.adoptNode == 'function') {

    /**
     * @return {Node}
     */
    nop.XML.prototype.toHTML = function() {
        return document.adoptNode( this.root(), true );
    };

} else if (typeof document.importNode == 'function') {

    /**
     * @return {Node}
     */
    nop.XML.prototype.toHTML = function() {
        return document.importNode( this.root(), true );
    };

} else {

    /**
     * @return {Node}
     */
    nop.XML.prototype.toHTML = function() {
        var node = this.root();
        if (!node) { return; }

        var name = 'div';
        switch (node.nodeName) {
            case '#text':
                return document.createTextNode(node.data);

            case 'tbody':
            case 'tr':
                name = 'table';
                break;

            case 'td':
                name = 'tr';
                break;

            case 'option':
                name = 'select';
                break;
        }

        var container = document.createElement(name);
        container.innerHTML = node.xml;

        return container.firstChild;
    };

}

// ----------------------------------------------------------------------------------------------------------------- //

if (typeof XPathEvaluator != 'undefined') {

    /** @private */
    nop.XML._XPathEvaluator = new XPathEvaluator();

    /**
     * @param {Node} root
     * @param {String} xpath
     * @return {Node|undefined}
     */
    nop.XML.select = function(root, xpath) {
        var result = nop.XML._XPathEvaluator.evaluate( xpath, root, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );

        if (result) {
            return result.singleNodeValue;
        }
    };

    /**
     * @param {Node} root
     * @param {String} xpath
     * @return {Array.<Node>|undefined}
     */
    nop.XML.selectNodes = function(root, xpath) {
        var result = nop.XML._XPathEvaluator.evaluate( xpath, root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );

        if (result) {
            var nodes = [];
            for (var i = 0, l = result.snapshotLength; i < l; i++) {
                nodes.push( result.snapshotItem(i) );
            }
            return nodes;
        }
    };

} else {

    /**
     * @param {Node} root
     * @param {String} xpath
     * @return {Node|undefined}
     */
    nop.XML.select = function(root, xpath) {
        return root.selectSingleNode(xpath);
    };

    /**
     * @param {Node} root
     * @param {String} xpath
     * @return {Array.<Node>|undefined}
     */
    nop.XML.selectNodes = function(root, xpath) {
        var result = root.selectNodes(xpath);

        if (result) {
            var nodes = [];
            for (var i = 0, l = result.length; i < l; i++) {
                nodes.push( result[i] );
            }
            return nodes;
        }
    };

}

/**
 * @param {String} xpath
 * @return {Node|undefined}
 */
nop.XML.prototype.select = function(xpath) {
    return nop.XML.select( this.root(), xpath );
};

/**
 * @param {String} xpath
 * @return {Array.<Node>|undefined}
 */
nop.XML.prototype.selectNodes = function(xpath) {
    return nop.XML.selectNodes( this.root(), xpath );
};

