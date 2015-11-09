# -*- coding: utf-8 -*-

from setuptools import setup

setup(
    name='WebWidukind',
    version='0.1.0',
    description='Web UI for Widukind Project',
    author='Michel Juillard',
    author_email='stephane.rault@radicalspam.org',
    url='https://github.com/Widukind/WebWidukind',
    zip_safe=False,
    include_package_data=True,
    scripts=['widukind_search_site.py'],
    install_requires=[
        'python-decouple',
        'pymongo>=3.0.0',
        'elasticsearch>=1.0.0,<2.0.0',
        'Flask',
        'flask-cors',
        'pandas>=0.12',
    ],    
    entry_points={
        'console_scripts': [
            'widukind-web = widukind_search_site:main',
        ],
    },            
)
