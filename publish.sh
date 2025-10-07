#!/usr/bin/env bash
git push origin main
git push origin_github main

git tag -a v0.2.6 -m "v0.2.6"
git push origin v0.2.6
git push origin_github v0.2.6
