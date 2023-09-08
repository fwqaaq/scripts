#!/bin/bash

# GIT_COMMITTER_NAME: 提交者，例如 B 提了 pr，而 A 合并了 PR，A 为提交者
# GIT_COMMITTER_EMAIL
# GIT_AUTHOR_NAME: 作者，B 就是作者
# GIT_AUTHOR_EMAIL

git filter-branch --env-filter '
OLD_EMAIL="old_gmail"
CORRECT_NAME="new_name"
CORRECT_EMAIL="new_gmail"
if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
