var widukind_root = 'http://widukind.cepremap.org';
var FrequencyFacets = React.createClass({
    getInitialState: function() {
	return { data: [{id: "Year", code: "a", selected: false},
			{id: "Semester", code: "h", selected: false},
		        {id: "Quarter", code: "q", selected: false},
		        {id: "Month", code: "m", selected: false},
		        {id: "Week", code: "w", selected: false},
		        {id: "Day", code: "d", selected: false}] };
    },

    __changeSelection: function(id) {
        var state = this.state.data.map(function(d) {
            return {
                id: d.id,
		code: d.code,
                selected: (d.id === id ? !d.selected : d.selected)
            };
        });
	
        this.setState({ data: state });
	
	var selection = [];
	for (var i=0; i < state.length; i++){
	    if (state[i].selected) selection.push(String(state[i].code))
	}
        this.props.handleFilter2("frequency","",selection);
    },

    render: function() {
        var checks = this.state.data.map(function(d) {
            return (
		<div key={d.id} >
                    <input type="checkbox"  checked={d.selected} onChange={this.__changeSelection.bind(this, d.id)} />
		    {d.id}
		<br/>
		    </div>
            );
        }.bind(this));

        return (
		<div>
		<h2>Frequency</h2>
		<form>
                {checks}
            </form>
		</div>
        );
    },
});

var ProvidersFacets = React.createClass({
    getInitialState: function() {
	return { data: [] };
    },

    componentWillMount: function(props) {
	    $.get(widukind_root + '/provider_facets',
	      {'code': this.props.code},
		  function(data){
		      if (this.isMounted()) {
			  this.setState({data: JSON.parse(data)});
		      }
	      }.bind(this));
    },

    __changeSelection: function(id) {
        var state = this.state.data.map(function(d) {
            return {
                id: d.id,
                selected: (d.id === id ? !d.selected : d.selected)
            };
        });
	
        this.setState({ data: state });
	
	var selection = [];
	for (var i=0; i < state.length; i++){
	    if (state[i].selected) selection.push(String(state[i].id).toLowerCase())
	}
	var filter = {provider: selection};
        this.props.handleFilter1(filter);
    },

    render: function() {
        var checks = this.state.data.map(function(d) {
            return (
		<div key={d.id} >
                    <input type="checkbox"  checked={d.selected} onChange={this.__changeSelection.bind(this, d.id)} />
		    {d.id}
		<br/>
		    </div>
            );
        }.bind(this));

        return (
		<div>
		<h2>Providers</h2>
		<form>
                {checks}
            </form>
		</div>
        );
    },
});

var Dimension = React.createClass({
    getInitialState: function() {
	return { folded: true, data: [] };
    },

    componentWillMount: function() {
	var state = this.props.codes.map( function(d) {
	    return {
		id: d[0],
		name: d[1],
		selected: false
	    };
	});
	this.setState({data: state});
    },
    
    handleOnClick: function (id) {
	this.setState({folded: !this.state.folded});
    },

    __changeSelection: function(id,parent) {
        var state = this.state.data.map(function(d) {
            return {
		name: d.name,
                id: d.id,
                selected: (d.id === id ? !d.selected : d.selected)
            };
        });
	
        this.setState({ data: state });
	
	var selection = [];
	for (var i=0; i < state.length; i++){
	    if (state[i].selected) selection.push(String(state[i].id).toLowerCase())
	}
        this.props.handleFilter2("dimensions",this.props.parent,selection);
    },
    
    render: function() {
	var codes = []
	if (!this.state.folded) {
            codes = this.state.data.map(function(d) {
		return (
			<div key={d.id} >
			<input type="checkbox"  checked={d.selected} onChange={this.__changeSelection.bind(this, d.id, this.props.parent)} />
			{d.name}
			<br/>
			</div>
		);
            }.bind(this));
	}
	
	return (
	    <div key={this.props.id}>
	    <li onClick={this.handleOnClick.bind(this,this.props.id)} >
	    {this.props.name} 
	    </li> 
		{codes}
	    </div>
	)
    }
});

var TreeNode = React.createClass({
    getInitialState: function() {
	return { data: [] };
    },
    onCategorySelect: function (ev) {
        if (this.props.onCategorySelect && !this.props.data.children) {
            this.props.onCategorySelect(this);
        }
        ev.preventDefault();
        ev.stopPropagation();
    },
    onChildDisplayToggle: function (ev) {
        if (this.props.data.children) {
            if (this.state.children && this.state.children.length) {
                this.setState({children: null});
            } else {
                this.setState({children: this.props.data.children});
            }
        }
        ev.preventDefault();
        ev.stopPropagation();
    },
    render: function () {
        if (!this.state.children){
	    this.state.children = [];
	}
        var classes = React.addons.classSet({
            'has-children': (this.props.data.children ? true : false),
            'open': (this.state.children.length ? true : false),
            'closed': (this.state.children ? false : true),
            'selected': (this.state.selected ? true : false)
        });
        return (
		<li ref="node" className={classes} key={this.props.key} 
                    onClick={this.onChildDisplayToggle}>
                <a onClick={this.onCategorySelect} 
                        data-id={this.props.data.id}>
                    {this.props.data.name}
                </a>
                <ul>
                    {this.state.children.map(function(child) {
                        return <TreeNode key={child.id}
                                data={child} 
                                onCategorySelect={this.props.onCategorySelect}/>;
                    }.bind(this))}
                </ul>
            </li>
        );
    }
});    
    
var DatasetFacets = React.createClass({
    getInitialState: function() {
	return { data: [] };
    },

    componentDidMount: function(props) {
	    $.get(widukind_root + '/dataset_facets',
		  {'provider': this.props.provider, 'code': this.props.code},
		  function(data){
		      if (this.isMounted()){
			  this.setState({data: JSON.parse(data)});
		      }
	      }.bind(this));
    },
    onSelect: function (node) {
        if (this.state.selected && this.state.selected.isMounted()) {
            this.state.selected.setState({selected: false});
        }
        this.setState({selected: node});
        node.setState({selected: true});
        if (this.props.onCategorySelect) {
            this.props.onCategorySelect(node);
        }
    },
    render: function() {
	var items
	if (this.state.data.length > 0) { 
	    items = this.state.data.map(function(d) {
		return <TreeNode key={d.id}
		parents={[d.code]}
		data={d} 
		onCategorySelect={this.onSelect} /> 
	    }.bind(this))
	}
        return (
		    <div className="panel panel-default">
                    <div className="panel-body">
                    <ul className="category-tree">
		    {items}
                    </ul>
                    </div>
		    </div>
            );
    }
});

var ButtonDatasetInfos = React.createClass({
    getInitialState: function() {
	return { results: [] };
    },

    componentWillUpdate: function(nextProps, nextState) {
	if (nextState.results.length) {
	    jQuery.facebox(nextState.results);
	}
    },
    
    handleButtonDatasetInfo: function(e) {
	    	e.preventDefault();
	    $.get(widukind_root + '/dataset_info',
		  {'code': this.props.code.toLowerCase()},
	      function(data){
		  this.setState({results: data});
	      }.bind(this));
    },

    render: function() {
	return <button class="btn btn-info" onClick = {this.handleButtonDatasetInfo}>I</button>;
    }
});
	    
var ButtonDatasetDownload = React.createClass({
    getInitialState: function() {
	return { results: [] };
    },

    handleButtonDatasetDownload: function(e) {
	e.preventDefault();
//	window.open('/download_dataset?datasetCode='+this.props.code+'&dimensions.code2[]=Gross domestic product&dimensions.code2[]=Gross national income');
	if (this.props.code.length) {
	    window.open(widukind_root + '/download_dataset?datasetCode='+this.props.code.toLowerCase());
	}
    },

    render: function() {
	return <button class="btn btn-download" onClick = {this.handleButtonDatasetDownload}>D</button>;
    }
});
	    
var ButtonSeriesDownload = React.createClass({
    getInitialState: function() {
	return { results: [] };
    },

    handleButtonSeriesDownload: function(e) {
	e.preventDefault();
	if (this.props.code.length) {
	    window.open(widukind_root + '/download_series?key='+this.props.code);
	}
    },

    render: function() {
	return <button class="btn btn-download" onClick = {this.handleButtonSeriesDownload}>D</button>;
    }
});
	    
var ButtonSeriesPrint = React.createClass({
    getInitialState: function() {
	return { results: [] };
    },

    componentWillUpdate: function(nextProps, nextState) {
	if (nextState.results.length) {
	    jQuery.facebox(nextState.results);
	}
    },
    
    handleButtonSeriesPrint: function(e) {
	    	e.preventDefault();
	    $.get(widukind_root + '/print_series',
	      {'key': this.props.code},
		  function(html){
		  this.setState({results: html});
	      }.bind(this));
    },

    render: function() {
	return <button class="btn btn-print" onClick = {this.handleButtonSeriesPrint}>P</button>;
    }
});
	    
var ButtonSeriesPlot = React.createClass({
    getInitialState: function() {
	return { results: [] };
    },

    componentWillUpdate: function(nextProps, nextState) {
	if (nextState.results.length) {
	    mw = window.open('','SeriesPlot')
	    mw.document.write(nextState.results);
	}
    },
    
    handleButtonSeriesPlot: function(e) {
	    	e.preventDefault();
	    $.get(widukind_root + '/plot_series',
	      {'key': this.props.code},
		  function(html){
		  this.setState({results: html});
	      }.bind(this));
    },

    render: function() {
	return <button class="btn btn-plot" onClick = {this.handleButtonSeriesPlot}>G</button>;
    }
});
	    
var DatasetsResult = React.createClass({
    render: function() {
	var self = this;
	
	if (this.props.optionaldatasetcode) {
	    return (
		    <div>
		    <tr><th>this.props.code</th></tr>
		    <tr>
		    <td>{this.props.provider}</td>
		    <td><button onClick={this.props.handleDatasetSeries.bind(null,self.props.provider.toLowerCase(),self.props.code.toLowerCase())}> {this.props.name}</button></td>
		    <td>{this.props.frequencies}</td>
		    <td><ButtonDatasetInfos code={this.props.code} /></td>
		    <td><ButtonDatasetDownload code={this.props.code} /></td>
		    </tr>
		    </div>
	    );
	} else {
	    return (
		    <tr>
		    <td>{this.props.provider}</td>
		    <td><button onClick={this.props.handleDatasetSeries.bind(null,self.props.provider.toLowerCase(),self.props.code.toLowerCase())}> {this.props.name}</button></td>
		    <td>{this.props.frequencies}</td>
		    <td><ButtonDatasetInfos code={this.props.code} /></td>
		    <td><ButtonDatasetDownload code={this.props.code} /></td>
		    </tr>
	    );
	}
    }});


var SeriesResult = React.createClass({
    render: function() {
	var provider = '';
	if (this.props.with_provider){
	    provider = <td>{this.props.provider}</td>;
	}
	return (
		<tr>
		{provider}
		<td>{this.props.name}</td>
		<td>{this.props.frequency}</td>
		<td><ButtonSeriesPrint code={this.props.code} /></td>
		<td><ButtonSeriesDownload code={this.props.code} /></td>
		<td><ButtonSeriesPlot code={this.props.code} /></td>
		</tr>
	);
    }
});


var SearchDatasetsResults = React.createClass({
    render: function() {
	var self = this
	var results = JSON.parse(this.props.results);
	
	return  <div><table>
	    <thead>
	    <tr><th>Provider</th><th>Dataset</th><th>Freq.</th></tr>
	    </thead>
	    <tbody>
	    {results.map( function(r) {
		return <DatasetsResult key={r.datasetCode} code={r.datasetCode} name={r.name} provider={r.provider}
		frequencies={r.frequencies} optionaldatasetcode={0} handleDatasetSeries={self.props.handleDatasetSeries} />;
	    }
			)}
	</tbody>
	</table></div>;
    }});
		    
var SearchSeriesResults = React.createClass({
    render: function() {
	var self = this;
	var results = JSON.parse(this.props.results);
	var header;
	if (self.props.with_provider)
	    header = <tr><th>Provider</th><th>Series name</th><th>Freq.</th></tr>;
	else
	    header = <tr><th>Series name</th></tr>;
	    
	var table = results.map( function(r) {
	    return <SeriesResult key={r.key} code={r.key} provider={r.provider} name={r.name}
	    frequency={r.frequency} optionaldatasetcode={0} with_provider={self.props.with_provider} />;
	});						       

	return( <table>
		<thead>
		{header}
		</thead>
		<tbody>
		{table}
		</tbody>
		</table>)
    }});
		    
     
var SearchFormDatasets = React.createClass({

    getInitialState: function() {
	return { searchString: '', results: [] };
    },

    handleChange: function(e) {
	this.setState ({searchString: e.target.value});
    },

    handleSubmit: function(e) {
	e.preventDefault();
	var data = "";
	if (this.state.searchString.length){
	    data = JSON.stringify({'query': this.state.searchString, 'filter': this.props.filter1});
	} else {
	    data = JSON.stringify({'query': null, 'filter': this.props.filter1});
	}
	$.ajax({
	    url: widukind_root + '/REST_datasets',
	    data: data, 
	    type: 'POST',
	    contentType: 'application/json',
	    success: function(d){
		this.setState({results: d})
	    }.bind(this)
	});
    },
    
    componentWillReceiveProps: function(nextProps) {
	this.setState({filter1: nextProps.filter1});
    },

    componentDidMount: function() {
	console.log(this.state)
	var data = "";
	data = JSON.stringify({'query': '*', 'filter': this.state.filter1});
	$.ajax({
	    url: widukind_root + '/REST_datasets',
	    data: data, 
	    type: 'POST',
	    contentType: 'application/json',
	    success: function(d){
		this.setState({results: d})
	    }.bind(this)
	});
    },
	
    render: function() {
	var optionalSearchDatasetsResults;
	var results = "";
	
	if (this.state.results.length > 0){
	    optionalSearchDatasetsResults = <SearchDatasetsResults results = {this.state.results} handleDatasetSeries={this.props.handleDatasetSeries}/>;
	}

		
	return 	<div>
	    <div>
	    <form>
	    <input class="search-form" type="text" value={this.state.searchString} onChange={this.handleChange} placeholder="Search query ..." />
	    <input type="submit" onClick={this.handleSubmit} value="Go" />
	    </form>
	    </div>
	    {optionalSearchDatasetsResults}
	    </div>;
    }
});

var SearchFormSeries = React.createClass({

    getInitialState: function() {
	return { searchString: '', results: [], filter1: {} };
    },

    
    handleChange: function(e) {
	this.setState ({searchString: e.target.value});
    },

    handleSubmitSeries: function(e) {
	e.preventDefault();
	var data = "";
	if (this.state.searchString){
	    data = JSON.stringify({'query': this.state.searchString, 'filter': this.props.filter1});
	} else {
	    data = JSON.stringify({'query': null, 'filter': this.props.filter1});
	}
	$.ajax({
	    url: widukind_root + '/REST_series',
	    data: data, 
	    type: 'POST',
	    contentType: 'application/json',
	    success: function(d){
		this.setState({results: d})
	    }.bind(this)
	});
    },
    
    componentWillReceiveProps: function(nextProps) {
	this.setState({filter1: nextProps.filter1});
    },

    componentDidMount: function() {
	console.log(this.state)
	var data = "";
	data = JSON.stringify({'query': '*', 'filter': this.state.filter1});
	$.ajax({
	    url: widukind_root + '/REST_series',
	    data: data, 
	    type: 'POST',
	    contentType: 'application/json',
	    success: function(d){
		this.setState({results: d})
	    }.bind(this)
	});
    },
	
    render: function() {
	console.log(this.state)
	var optionalSearchResults;
	var results = "";
	

	if (this.state.results.length > 0){
	    optionalSearchResults = <SearchSeriesResults results = {this.state.results} with_provider={true} />;
	}
	console.log(optionalSearchResults)
	
	return <div>
	    <div>
	    <form>
	    <input  class="search-form" type="text" value={this.state.searchString} onChange={this.handleChange} placeholder="Search query ..." />
	    <input type="submit" onClick={this.handleSubmitSeries} value="Go" />
	    </form>
	    </div>
	    {optionalSearchResults}
	    </div>;
    }
});

var SearchFormDatasetSeries = React.createClass({

    getInitialState: function() {
	return { searchString: '', results: [] };
    },

    updateSearchResults: function() {
	var data = "";
	if (this.state.searchString.length){
	    data = JSON.stringify({'query': this.state.searchString, 'filter': this.props.filters});
	} else {
	    data = JSON.stringify({'query': null, 'filter': this.props.filters});
	}
	$.ajax({
	    url: widukind_root + '/REST_series',
	    data: data, 
	    type: 'POST',
	    contentType: 'application/json',
	    success: function(d){
		this.setState({results: d})
	    }.bind(this)
	});
    },
    
    handleChangeDatasetSeries: function(e) {
	this.setState ({searchString: e.target.value});
    },

    handleSubmitDatasetSeries: function(e) {
	e.preventDefault();
	this.updateSearchResults();
    },
    
    componentWillReceiveProps: function(nextProps) {
	this.setState({filters: nextProps.filters});
	this.updateSearchResults();
    },

    componentDidMount: function() {
	this.updateSearchResults();
    },
	
    render: function() {
	var optionalResults;
	var results = "";
	
	if (this.state.results.length > 0){
	    optionalResults = <SearchSeriesResults results = {this.state.results} with_provider={false} />;
	}

		
	return <div>
	    <div>
	    <form>
	    <input  class="search-form" type="text" value={this.state.searchString} onChange={this.handleChangeDatasetSeries} placeholder="Search query ..." />
	    <input type="submit" onClick={this.handleSubmitDatasetSeries} value="Go" />
	    </form>
	    </div>
	    {optionalResults}
	    </div>;
    }
});

var WidukindSearchDatasets = React.createClass({

    getInitialState: function() {
	return { filter1: [] };
    },

    handleFilter1: function(filter) {
	this.setState({filter1: filter})
    },
	
    render: function() {
	return (
		<div>
	        <div id="banner">
  		  <h1>Widukind search</h1>
		  <p className="lead">A database of international macroeconomic data</p>
		</div>

		<div id="main-inner-2">
		<div id="main-inner-1">
		
		<div id="facets1-2">
		<ProvidersFacets handleFilter1={this.handleFilter1} />
		</div>
		<div id="results-2">
		<SearchFormDatasets handleDatasetSeries={this.props.handleDatasetSeries} filter1={this.state.filter1} />
 		</div>
		</div>

		</div>
	    </div>
	);
    }
});

var WidukindSearchSeries = React.createClass({

    getInitialState: function() {
	return { filter1: [] };
    },

    handleFilter1: function(filter) {
	this.setState({filter1: filter})
    },
	
    render: function() {
	return (
		<div>
	        <div id="banner">
  		<h1>Widukind search</h1>
		<p className="lead">A database of international macroeconomic data</p>
		</div>
		<div id="main-inner-2">
		<div id="main-inner-1">
		<div id="facets1-2">
		<ProvidersFacets handleFilter1={this.handleFilter1} />
		</div>
		<div id="results-2">
		<SearchFormSeries filter1={this.state.filter1} />
 		</div>
		</div>
		</div>
		</div>
	);
    }
});

var WidukindSearchDatasetSeries = React.createClass({
    getInitialState: function() {
	return { filter2: {} };
    },

    handleFilter2: function(node) {
	filter_tmp = this.state.filter2;
	filter_tmp[node._currentElement.props.data.field] = node._currentElement.props.data.code;
	this.setState({filter2: filter_tmp});
    },
	
    render: function() {
	var filters = this.state.filter2;
	filters.datasetCode = this.props.datasetCode;
	return (
		<div>
	        <div id="banner">
  		  <h1>Widukind search</h1>
		  <p className="lead">A database of international macroeconomic data</p>
		</div>

		<div id="main-inner-2">
		<div id="main-inner-1">
		
		<div id="facets1-2">
		<DatasetFacets provider={this.props.provider} code={this.props.datasetCode} onCategorySelect={this.handleFilter2} />
		</div>
		<div id="results-2">
		<SearchFormDatasetSeries filters={filters} />
 		</div>

		</div>
		</div>
	    </div>
	);
    }
});

var Menu = React.createClass({

    getInitialState: function(){
        return { focused: 0 };
    },

    clicked: function(index){

        // The click handler will update the state with
        // the index of the focused menu entry

        this.setState({focused: index});
	this.props.menuChoice(this.props.items[index]);
    },

    render: function() {

        // Here we will read the items property, which was passed
        // as an attribute when the component was created

        var self = this;

        // The map method will loop over the array of menu entries,
        // and will return a new array with <li> elements.

        return (
	    <div>
		<div id="menu">
                <ul>{ this.props.items.map(function(m, index){
		    
                    var style = '';
		    
                    if(self.state.focused == index){
                        style = 'focused';
                    }
        
                    // Notice the use of the bind() method. It makes the
                    // index available to the clicked function:
        
                    return <li className={style} key={m} onClick={self.clicked.bind(self, index)}>{m}</li>;
        
                })
		    }
	    </ul>
		</div>
		</div>
        );
    }
});

var Home = React.createClass({
    render: function(){
	return(
		<div id="homepage">
		<h1>Widukind Search</h1>
		<p> You can search either by datasets or by series </p>
		</div>
	);
    }
});

var Datasets = React.createClass({
    render: function(){
	return(
		<WidukindSearchDatasets handleDatasetSeries={this.props.handleDatasetSeries} />
	);
    }
});

var DatasetSeries = React.createClass({
    render: function(){
	return(
		<WidukindSearchDatasetSeries provider={this.props.provider} datasetCode={this.props.datasetCode} />
	);
    }
});

var Series = React.createClass({
    render: function(){
	return(
		<WidukindSearchSeries  />
	);
    }
});

var App = React.createClass({
    
    
    getInitialState: function(){
	return {currentChoice: 'Home', provider: '', datasetCode: ''};
    },
    
    handleChoice: function(choice) {
	this.setState({currentChoice: choice})
    },
    
    handleDatasetSeries: function(provider, code) {
	this.setState({currentChoice: 'DatasetSeries', provider: provider, datasetCode: code})
    },

    render: function() {
	var optionalChoice;
	var self = this;

	switch (self.state.currentChoice) {
	case 'Home':
	    optionalChoice = <Home />;
	    break;
	case 'Datasets':
	    optionalChoice = <Datasets handleDatasetSeries={self.handleDatasetSeries} />;
	    break;
	case 'DatasetSeries':
	    optionalChoice = <DatasetSeries datasetCode={self.state.datasetCode} />;
	    break;
	case 'Series':
	    optionalChoice = <Series />;
	    break;
	default:
	    console.error("Oops, shouldn't arrive here");
	}

	    return(
		    <div>
		    <Menu items =  {['Home', 'Series', 'Datasets']} menuChoice = {this.handleChoice} />
		    {optionalChoice}
		</div>
	);
    }
});

React.render(
	<App />,
    document.body
);
