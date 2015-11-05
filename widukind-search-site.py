#! /usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, redirect, session, make_response, abort, send_from_directory
from flask.ext.cors import CORS
from dlstats import configuration
import pymongo
import os
import pandas
import io
import csv
from bson.json_util import dumps
from collections import OrderedDict
import datetime
from bson import json_util

from decouple import config as env_config

MONGODB_URL = env_config('MONGODB_URL', 'mongodb://localhost/widukind')
ES_URL = env_config('ES_URL', 'http://localhost:9200')
SECRET_KEY = env_config('SECRET_KEY', 'very very secret key key key')

def get_es_client():
    from elasticsearch import Elasticsearch
    from urllib.parse import urlparse
    url = urlparse(ES_URL)
    es = Elasticsearch([{"host":url.hostname, "port":url.port}])
    return es

client = pymongo.MongoClient(MONGODB_URL)
db = client.get_default_database()

es = get_es_client()

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = SECRET_KEY
#app.secret_key = os.urandom(24)
cors = CORS(app)

@app.route('/facefiles/<file>')
def facefiles(file):
    return send_from_directory('facefiles',file)

@app.route('/dataset_facets', methods = ['GET', 'POST'])
def dataset_facets():
    provider = request.args.get('provider')
    code = request.args.get('code')
    filter = {'provider': provider, 'datasetCode': code}
    res = es.search(index = 'widukind', doc_type = 'datasets', size=20, body=form_es_query({},filter))
    s  = res['hits']['hits'][0]["_source"]
    facets = []
    id = 1
    if 'frequencies' in s:
        freqs = []
        for f in s['frequencies']:
            if (f == 'A'):
                freqs.append({'id': id, 'field': 'frequency', 'code': 'a', 'name': 'Year'})
            elif (f == 'S'):
                freqs.append({'id': id, 'field': 'frequency', 'code': 's', 'name': 'Semester'})
            elif (f == 'Q'):
                freqs.append({'id': id, 'field': 'frequency', 'code': 'q', 'name': 'Quarter'})
            elif (f == 'M'):
                freqs.append({'id': id, 'field': 'frequency', 'code': 'm', 'name': 'Month'})
            elif (f == 'W'):
                freqs.append({'id': id, 'field': 'frequency', 'code': 'w', 'name': 'Week'})
            elif (f == 'D'):
                freqs.append({'id': id, 'field': 'frequency', 'code': 'd', 'name': 'Day'})
            id += 1
        facets.append({'id': id, 'code': 'frequencies', 'name': 'Frequency', 'children': freqs})
        id += 1
    ndim = 0
    dim1 = []
    for c in s['codeList']:
        code_list = s['codeList'][c]
        if len(code_list) > 1:
            dim2 = []
            for d in code_list:
                dim2.append({'id': id, 'field': 'dimensions.'+c, 'code': d[0].lower(), 'name': d[1]})
                id += 1
            dim1.append({'id': id, 'code': c, 'name': c, 'children': dim2})
            id += 1
            ndim += 1
    if ndim > 0:
        facets.append({'id': id, 'code': 'dimensions', 'name': 'Dimensions', 'children': dim1})
        id += 1
    return dumps(facets)

@app.route('/provider_facets', methods = ['GET', 'POST'])
def provider_facets():
    mb = pymongo.MongoClient(**configuration['MongoDB'])
    providers = mb.widukind.providers.find()
    results = []
    for p in providers:
        results.append({'id': p['name'], 'selected': False, 'url': p['website']})
    return dumps(results)

@app.route('/REST_datasets', methods = ['POST'])
def REST_datasets():
    if not request.json:
        abort(400)
    if 'query' in request.json and request.json['query'] is not None:
        query = request.json['query']
    else:
        query = {}
    filter = {}    
    if 'filter' in request.json and request.json['filter'] is not None:
        filter0 = request.json['filter']
        for f in filter0:
            if len(filter0[f]) > 0:
                filter[f] = filter0[f]
    else:
        filter = {}
    results = elasticsearch_query_datasets(query,filter)
    return dumps(results)

@app.route('/REST_series', methods = ['POST'])
def REST_series():
    if not request.json:
        abort(400)
    if 'query' in request.json and request.json['query'] is not None:
        query = request.json['query']
    else:
        query = {}
    filter = {}    
    if 'filter' in request.json and request.json['filter'] is not None:
        filter0 = request.json['filter']
        for f in filter0:
            if len(filter0[f]) > 0:
                filter[f] = filter0[f]
    else:
        filter = {}
    results = elasticsearch_query_series(query,filter)
    print(results)
    return dumps(results)

@app.route('/dataset_info', methods = ['GET', 'POST'])
def dataset_info():
    code = request.args.get('code')
    filter = {'datasetCode': code}
    res = es.search(index = 'widukind', doc_type = 'datasets', size=20, body=form_es_query({},filter))
    s  = res['hits']['hits'][0]["_source"]
    print(s)
    html =  "<div><table>" 
    html += "<tr><th>Name:</th><td>"+s['name']+"</td></tr>" 
    html += "<tr><th>Code:</th><td>"+code+"</td></tr>" 
    if (s['docHref'] is not None):
        html += '<tr><th>Provider doc:</th><td><a href="'+s['docHref']+'" target="popup">Web</a></td></tr>' 
    html += "<tr><th>Last update:</th><td>"+str(s['lastUpdate'])+"</td></tr>" 
    html += "<tr><th>Dimensions</th></tr>";
    c = s['codeList']
    cc = OrderedDict(sorted(c.items(), key = lambda t: t[0].lower()))
    s['codeList'] = cc
    for k in cc:
        html += "<tr><th></th><th>"+k+"</th></tr>"
        print(cc[k])
        for kk in cc[k]:
            if type(kk) is str:
                html += "<tr><th></th><td>"+kk+"</td>"
            else:
                html += "<tr><th></th><td>"+kk[0]+"</td>"
                html += "<td>"+kk[1]+"</td>"
            html += "</tr>"
    html += "</table></div>"
    return html

def elasticsearch_query_datasets(query={},filter={}):
    res = es.search(index = 'widukind', doc_type = 'datasets', size=20, body=form_es_query(query,filter))
    results = []
    for hit in res['hits']['hits']:
        s = hit["_source"]
        # code to be simplified once Insee is fixed
        r = {"datasetCode": s["datasetCode"], "name": s["name"], "provider": s["provider"]}
        if "frequencies" in s:
            r.update({"frequencies": s["frequencies"]})
        else:
            r.update({"frequencies": ''})
        results.append(r)
    return results

def elasticsearch_get_dataset(datasetCode):
    res = es.search(index = 'widukind', doc_type = 'datasets', size=20, body={"filter": {"term": {'datasetCode': datasetCode}}})
    if len(res['hits']['hits']):
        print(res['hits']['hits'][0]['_source'])
        return res['hits']['hits'][0]['_source']

def mongodb_series_by_key(key):
    mb = pymongo.MongoClient(**configuration['MongoDB'])
    print(key)
    series = mb.widukind.series.find_one({'key': key},{'revisions': 0})
    return series
    
def mongodb_series_by_filter(filter):
    mb = pymongo.MongoClient(**configuration['MongoDB'])
    res = mb.widukind.series.find(filter,{'revisions': 0, 'releaseDates': 0})
    return res
    
def mongodb_dataset_by_code(code):
    mb = pymongo.MongoClient(**configuration['MongoDB'])
    series = mb.widukind.series.find_one({'datasetCode': code})
    return series
    
def elasticsearch_query_series(query,filter={}):
    res = es.search(index = 'widukind', doc_type = 'series', size=20, body=form_es_query(query,filter))
    results = []
    for hit in res['hits']['hits']:
        s = hit["_source"]
        bson = {"key": s["key"], "name": s["name"], "provider": s["provider"]}
        if 'frequency' in s:
            bson.update({"frequency": s["frequency"]})
        results.append(bson)
    return results

def form_es_query(query,filter):
    print(query,filter)
    if filter is not None and len(filter):
        filter1 = {}
        filter2 = {}
        for f in filter:
            if type(filter[f]) is str:
                filter1[f] = filter[f]
            elif type(filter[f]) is list:
                filter2[f] = filter[f]
            elif type(filter[f]) is dict:
                for f1 in filter[f]:
                    if type(filter[f][f1]) is str:
                        filter1[f+'.'+f1] = filter[f][f1]
                    elif type(filter[f][f1]) is list:
                        filter2[f+'.'+f1] = filter[f][f1]
        print('filter1',filter1)
        print('filter2',filter2)
        f = []
        for k,v in filter1.items():
            f.extend([{'term': {k:v}}])
        for k,v in filter2.items():
            f.extend([{'terms': {k:v}}])
        print('f',f)
        if len(f) > 1:
            filters = {'bool': {'must': f}}
        elif len(f) == 1:
            filters = f[0]
        if len(query):
            es_query = {
                'query': {
                    'filtered': {
                        'query': {
                            'query_string': {
                                'query': query
                            }
                        },
                        'filter': filters
                    }
                }
            }
        else:
            es_query = {"filter": filters}
    else:
        es_query = {"query": {"query_string": {"query": query}}}
    print(es_query)
    return es_query

@app.route('/')
def initial_page():
#    return render_template('search_series.html')
    return render_template('search.html')

@app.route('/facet1', methods = ['POST'])
def facet1():
    req = []
    if 'provider' in request.form.keys():
        req = request.form['provider']
    print(req)
    return redirect('/')

@app.route('/search_datasets', methods = ['GET','POST'])
def search_datasets():
    if 'query' in request.form:
        query = request.form['query']
    else:
        query = ''
    print(query)
    results = elasticsearch_query_datasets(query)
    print(results)
    session['query'] = query
    session['results'] = results
    return render_template('search_datasets.html')

@app.route('/search_series_in_dataset', methods = ['GET','POST'])
def search_series_in_dataset():
    if 'query' in request.form:
        query = request.form['query']
    else:
        query = ''
    datasetCode = request.form['datasetCode']
    filter = {'datasetCode': datasetCode}
    results = elasticsearch_query_series(query,filter)
    dataset = elasticsearch_get_dataset(datasetCode)
    print(dataset)
    session['query'] = query
    session['filter'] = filter
    session['results'] = results
    session['datasetCode'] = datasetCode
    session['datasetName'] = dataset['name']
    session['dataset'] = dataset
    return render_template('search_series_in_dataset.html')

@app.route('/search_series', methods = ['POST'])
def search_series():
    if not request.json:
        abort(400)
    if 'query' not in request.json:
        query = {}
    if 'filter' not in request.json:
        filter = {}
    results = elasticsearch_query_series(query,filter)
    return dump

@app.route('/print_series', methods = ['GET', 'POST'])
def print_series():
    key = request.args.get('key')
    series = mongodb_series_by_key(key)
    print(key,series)
    sd = pandas.Period(ordinal=series['startDate'],freq=series['frequency'])
    html =  "<div><table>" 
    html += "<tr><th>Name:</th><td>"+series['name']+"</td></tr>" 
    html += "<tr><th>Key:</th><td>"+key+"</td></tr>" 
    html += "<tr><th>Dimensions</th></tr>"
    for d in series['dimensions']:
        html += "<tr><td></td><th>"+d+"</th><td>"+series['dimensions'][d]+"</td></tr>"
    for val in series['values']:
        html += "<tr><th>"+str(sd)+"</th><td>"+val+"</td></tr>"
        sd += 1
    html += "</table></div>"
    return html

@app.route('/plot_series', methods = ['GET', 'POST'])
def plot_series():
    key = request.args.get('key')
    series = mongodb_series_by_key(key)
    sd = pandas.Period(ordinal=series['startDate'],freq=series['frequency'])
    html = """<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <title>Widukind search</title>	
    <script type="text/javascript"  src="static/dygraph-combined.js"></script>
    </head>  
    <body>"""
    html += "<h1>"+series['name']+"</h1>"
    html += '<div id="graphdiv" style="width:90%;"></div>'
    html += '<script type="text/javascript">'
    html += 'g = new Dygraph('
    html += 'document.getElementById("graphdiv"),\n'
    html += '"Date,'+series['name']+'\\n" +\n'
    for val in series['values'][:-1]:
        html += '"'+str(sd.to_timestamp())+", " + val + '\\n" +\n'
        sd += 1
    html += '"'+str(sd.to_timestamp())+", " + series['values'][-1] + '\\n"'
    html += ");</script></body></html>"
    print(html)
    return html

@app.route('/download_series', methods = ['GET', 'POST'])
def download_series():
    key = request.args.get('key')
    series = mongodb_series_by_key(key)
    sd = pandas.Period(ordinal=series['startDate'],freq=series['frequency'])
    values = []
    for val in series['values']:
        values.append([str(sd), val])
        sd += 1
    csv_output = io.StringIO()
    writer = csv.writer(csv_output, quoting=csv.QUOTE_NONNUMERIC)
    writer.writerows(values)
    
    response = make_response(csv_output.getvalue())
    response.headers["Content-disposition"] = "attachment; filename="+key+".csv"
    
    return response

@app.route('/download_dataset', methods = ['GET', 'POST'])
def download_dataset():
    data = request.args
    filter = {}
    for d in data:
        if d[-2:] == '[]':
            d1 = d[:-2]
            filter[d1] = {'$in': data.getlist(d)}
        else:
            filter[d] = data[d]
    print(filter)
    dataset = mongodb_dataset_by_code(filter['datasetCode'])
    series = mongodb_series_by_filter(filter)
    print(filter,series.count())
    ck = list(dataset['dimensions'].keys())
    cl = sorted(ck, key = lambda t: t.lower())
    headers = ['key']+cl
    dmin = float('inf')
    dmax = -float('inf')
    for s in series:
        if s['startDate'] < dmin:
            dmin = s['startDate']
        if s['endDate'] > dmax:
            dmax = s['endDate']
        freq = s['frequency']
    pDmin = pandas.Period(ordinal=dmin,freq=freq);
    pDmax = pandas.Period(ordinal=dmax,freq=freq);
    headers += list(pandas.period_range(pDmin,pDmax,freq=freq).to_native_types())
    elements = [headers]
    series.rewind()
    for s in series:
        row = [s['key']]
        for c in cl:
            if c in s['dimensions']:
                row.append(s['dimensions'][c])
            else:
                row.append('')
        p_start_date = pandas.Period(ordinal=s['startDate'],freq=freq)
        p_end_date = pandas.Period(ordinal=s['endDate'],freq=freq)
        for d in pandas.period_range(pDmin,p_start_date-1,freq=freq):
            row.append(None)
        for val in s['values']:
            row.append(val)
        for d in pandas.period_range(p_end_date+1,pDmax,freq=freq):
            row.append(None)
        elements.append(row)
    csv_output = io.StringIO()
    writer = csv.writer(csv_output, quoting=csv.QUOTE_NONNUMERIC)
    writer.writerows(elements)

    response = make_response(csv_output.getvalue())
    response.headers["Content-disposition"] = "attachment; filename="+filter['datasetCode']+".csv"

    return response

@app.route('/EVIEWS/<provider>/dataset/<dataset_code>/values', methods = ['GET', 'POST'])
def EVIEWS_query_series(provider,dataset_code):
    query = {}
    query['provider'] = provider;
    query['datasetCode'] = str(dataset_code);
    for r in request.args.lists():
        if r[0] == 'frequency':
            query['frequency'] = r[1][0]
        else:
            query['dimensions.'+r[0]] = {'$regex': r[1][0]}
    results = mongodb_series_by_filter(query)
    table = {}
    table['vnames'] = []
    table['desc'] = []
    table['dates'] = []
    table['values'] = []
    init = True
    
    for r in results:
        if init:
            freq = r['frequency']
            dmin = r['startDate']
            dmax = r['endDate']
            pStartDate = pandas.Period(ordinal=r['startDate'],freq=freq)
            pEndDate = pandas.Period(ordinal=r['endDate'],freq=freq)
            pDmin = pandas.Period(ordinal=dmin,freq=freq);
            pDmax = pandas.Period(ordinal=dmax,freq=freq);
            table['dates'] = pandas.period_range(pStartDate,pEndDate,freq=freq).to_native_types()
            init = False
        print(r['key'])
        if r['frequency'] != freq:
            continue
        if r['startDate'] < dmin:
            dmin = r['startDate']
        if r['endDate'] > dmax:
            dmax = r['endDate']
        print(r['key'])
        table['vnames'].append(r['key'])
        table['desc'].append(r['name'])
        table['values'].append(r['values'])
    string = "<table>\n"
    string += "<tr><th>Dates</th>"
    for v in table['vnames']:
        string += "<th>" + v + "</th>"
    string += "</tr>\n"
    string += "<tr><th></th>" 
    for d in table['desc']:
        string += "<th>" + d + "</th>"
    string += "</tr>\n"
    for index,p in enumerate(table['dates']):
        string += "<tr><td>" + p + "</td>"
        for v in table['values']:
            string += "<td>" + v[index] + "</td>"
        string += "</tr>\n"
    string += "</table>\n"
    
    return(string)

@app.route('/providers', methods=["GET"])
def get_providers():
    return json_util.dumps(db.providers.find(), default=json_util.default)

@app.route('/<provider>', methods=["GET"])
def get_provider(provider):
    return json_util.dumps(db.providers.find_one({'name': provider}), default=json_util.default)

@app.route('/<provider>/categories', methods=["GET"])
def get_categories(provider):
    return json_util.dumps(db.categories.find({'provider': provider}), default=json_util.default)

@app.route('/<provider>/categories/<id_category>', methods=["GET"])
def get_category(provider,id_category):
    return json_util.dumps(db.categories.find(
        {'provider': provider, '_id':bson.ObjectId(id_category)}), default=json_util.default)

@app.route('/<provider>/datasets', methods=["GET"])
def get_datasets(provider):
    return json_util.dumps(db.datasets.find({'provider': provider}), default=json_util.default)

@app.route('/<provider>/dataset/<dataset_code>', methods=["GET"])
def get_dataset(provider,dataset_code):
    return json_util.dumps(db.datasets.find(
        {'provider': provider, 'datasetCode': dataset_code}), default=json_util.default)

@app.route('/<provider>/dataset/<dataset_code>/series', methods=["GET"])
def get_series(provider,dataset_code):
    return json_util.dumps(db.series.find(
        {'provider': provider, 'datasetCode':dataset_code}), default=json_util.default)

@app.route('/<provider>/dataset/<dataset_code>/series/<key>',
                   methods=["GET"])
@app.route('/<provider>/series/<key>',
                   methods=["GET"])
def get_a_series(provider,key,dataset_code=None):
    if dataset_code:
        return json_util.dumps(db.series.find(
            {'provider': provider, 'datasetCode':dataset_code,'key':key} ), default=json_util.default)
    else:
        return json_util.dumps(db.series.find(
            {'provider': provider, 'key':key} ), default=json_util.default)

@app.route('/<provider>/dataset/<dataset_code>/values',
                   methods=["GET"])
def get_values(provider,dataset_code):
    query = {}
    query['datasetCode'] = dataset_code;
    for r in request.args.lists():
        query['dimensions.'+r[0]] = {'$regex': r[1][0]};
    return json_util.dumps(db.series.find(query,{'releaseDates':0,'revisions':0,'attributes':0}), default=json_util.default)

    
        
if __name__ == '__main__':
    app.debug = True
    app.run()
