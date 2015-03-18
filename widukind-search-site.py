from flask import Flask, render_template, request, redirect, session, make_response
from dlstats import configuration
import pymongo
from elasticsearch import Elasticsearch
import os
import pandas
import io
import csv

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'very very secret key key key'
#app.secret_key = os.urandom(24)

def elasticsearch_query_datasets(query,filter={}):
    es = Elasticsearch(host = "localhost")
    res = es.search(index = 'widukind', doc_type = 'datasets', size=20, body=form_es_query(query,filter))
    results = []
    for hit in res['hits']['hits']:
        s = hit["_source"]
        results.append({"datasetCode": s["datasetCode"], "name": s["name"]})
    return results

def elasticsearch_get_dataset(datasetCode):
    es = Elasticsearch(host = "localhost")
    res = es.search(index = 'widukind', doc_type = 'datasets', size=20, body={"filter": {"term": {'datasetCode': datasetCode}}})
    if len(res['hits']['hits']):
        print(res['hits']['hits'][0]['_source'])
        return res['hits']['hits'][0]['_source']

def mongodb_series_by_key(key):
    mb = pymongo.MongoClient(**configuration['MongoDB'])
    print(key)
    series = mb.widukind.series.find_one({'key': key},{'revisions': 0})
    return series
    
def elasticsearch_query_series(query,filter={}):
    es = Elasticsearch(host = "localhost")
    res = es.search(index = 'widukind', doc_type = 'series', size=20, body=form_es_query(query,filter))
    results = []
    for hit in res['hits']['hits']:
        s = hit["_source"]
        results.append({"key": s["key"], "name": s["name"]})
    return results

def form_es_query(query,filter):
    if len(filter):
        if len(query):
            es_query = {
                'query': {
                    'filtered': {
                        'query': {
                            'query_string': {
                                'query': query
                            }
                        },
                        'filter': {
                            'term': filter
                        }
                    }
                }
            }
        else:
            es_query = {"filter": {"term": filter}}
    else:
        es_query = {"query": {"query_string": {"query": query}}}
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

@app.route('/search_series', methods = ['GET','POST'])
def search_series():
    if 'query' in request.form:
        query = request.form['query']
    else:
        query = ''
    results = elasticsearch_query_series(query)
    session['query'] = query
    session['results'] = results
    return render_template('search_series.html')

@app.route('/print_series', methods = ['GET', 'POST'])
def print_series():
    key = next(request.args.lists())[0]
    series = mongodb_series_by_key(key)
    session['name'] = series['name']
    session['key'] = series['key']
    session['dimensions'] = series['dimensions']
    sd = pandas.Period(series['startDate'],freq=series['frequency'])
    values = []
    for val in series['values']:
        values.append([str(sd), val])
        sd += 1
    session['elements'] = values
    return render_template('print_series.html')

@app.route('/plot_series', methods = ['GET', 'POST'])
def plot_series():
    key = next(request.args.lists())[0]
    series = mongodb_series_by_key(key)
    session['name'] = series['name']
    session['key'] = series['key']
    sd = pandas.Period(series['startDate'],freq=series['frequency'])
    values = []
    for val in series['values'][:-1]:
        values.append([sd.to_timestamp(), val, '+'])
        sd += 1
    values.append([sd.to_timestamp(), val, ''])
    session['elements'] = values
    return render_template('plot_series.html')

@app.route('/download_series', methods = ['GET', 'POST'])
def download_series():
    key = next(request.args.lists())[0]
    series = mongodb_series_by_key(key)
    sd = pandas.Period(series['startDate'],freq=series['frequency'])
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

if __name__ == '__main__':
    app.debug = True
    app.run()
