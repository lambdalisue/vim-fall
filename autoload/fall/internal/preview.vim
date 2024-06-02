function! fall#internal#preview#detect() abort
  let l:eventignore = &eventignore
  try
    let &eventignore = join(split(&eventignore, ',') + ['FileType'], ',')
    silent! filetype detect
  finally
    let &eventignore = l:eventignore
  endtry
endfunction

function! fall#internal#preview#highlight(filetype) abort
  let l:filetype = empty(a:filetype) ? &filetype : a:filetype
  silent! execute printf('runtime syntax/%s.vim', fnameescape(l:filetype))
endfunction

